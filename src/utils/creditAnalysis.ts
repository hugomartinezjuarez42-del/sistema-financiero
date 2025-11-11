import type { Client, Loan } from '../App';

export interface CreditAnalysis {
  score: number;
  risk: 'bajo' | 'medio' | 'alto' | 'muy-alto';
  recommendation: string;
  maxRecommendedLoan: number;
  shouldLend: boolean;
  reasons: string[];
  paymentBehavior: {
    avgDaysLate: number;
    onTimePaymentRate: number;
    totalLoans: number;
    activeLoans: number;
    paidLoans: number;
    defaultedLoans: number;
  };
}

function calcLoanState(loan: Loan, rate: number, currentDate: Date) {
  const loanDate = new Date(loan.date);
  const daysPassed = Math.max(0, Math.floor((currentDate.getTime() - loanDate.getTime()) / (1000 * 60 * 60 * 24)));
  const quincenas = Math.floor(daysPassed / 15);

  const totalCapitalPaid = loan.payments.reduce((sum, p) => sum + p.amount, 0);
  const capitalRestante = Math.max(0, loan.principal - totalCapitalPaid);

  const accruedInterest = loan.principal * (rate / 100) * quincenas;
  const totalInterestPaid = (loan.interestPayments || []).reduce((sum, p) => sum + p.amount, 0);
  const pendingInterest = Math.max(0, accruedInterest - totalInterestPaid);

  return {
    outstanding: capitalRestante,
    accruedInterest,
    pendingInterest,
    totalDue: capitalRestante + pendingInterest,
    quincenas,
    isFullyPaid: capitalRestante === 0 && pendingInterest === 0
  };
}

export function analyzeCreditBehavior(client: Client): CreditAnalysis {
  const currentDate = new Date();
  const reasons: string[] = [];
  let score = 100;

  const totalLoans = client.loans.length;
  const activeLoans = client.loans.filter(loan => {
    const state = calcLoanState(loan, client.rate, currentDate);
    return !state.isFullyPaid;
  });

  const paidLoans = client.loans.filter(loan => {
    const state = calcLoanState(loan, client.rate, currentDate);
    return state.isFullyPaid;
  });

  let totalDaysLate = 0;
  let latePaymentCount = 0;
  let onTimePayments = 0;
  let totalPaymentOpportunities = 0;

  let totalDebt = 0;
  let totalOverdueInterest = 0;

  activeLoans.forEach(loan => {
    const state = calcLoanState(loan, client.rate, currentDate);
    totalDebt += state.totalDue;
    totalOverdueInterest += state.pendingInterest;

    if (state.quincenas > 0) {
      totalPaymentOpportunities += state.quincenas;

      const expectedPayments = state.quincenas;
      const actualPayments = (loan.interestPayments || []).length;

      if (actualPayments < expectedPayments) {
        const missedPayments = expectedPayments - actualPayments;
        latePaymentCount += missedPayments;
        totalDaysLate += missedPayments * 15;
      } else {
        onTimePayments += actualPayments;
      }
    }
  });

  paidLoans.forEach(loan => {
    const loanDate = new Date(loan.date);
    const lastPaymentDate = loan.payments.length > 0
      ? new Date(Math.max(...loan.payments.map(p => new Date(p.date).getTime())))
      : loanDate;

    const daysToPay = Math.floor((lastPaymentDate.getTime() - loanDate.getTime()) / (1000 * 60 * 60 * 24));
    const state = calcLoanState(loan, client.rate, lastPaymentDate);

    const expectedQuincenas = state.quincenas;
    totalPaymentOpportunities += expectedQuincenas;
    onTimePayments += expectedQuincenas;
  });

  const onTimePaymentRate = totalPaymentOpportunities > 0
    ? (onTimePayments / totalPaymentOpportunities) * 100
    : 100;

  const avgDaysLate = latePaymentCount > 0 ? totalDaysLate / latePaymentCount : 0;

  if (totalLoans === 0) {
    score = 70;
    reasons.push('Cliente nuevo sin historial');
  }

  if (activeLoans.length > 3) {
    score -= 15;
    reasons.push(`Tiene ${activeLoans.length} préstamos activos simultáneos`);
  }

  if (totalOverdueInterest > 5000) {
    score -= 25;
    reasons.push(`Tiene L ${totalOverdueInterest.toFixed(2)} en intereses vencidos acumulados`);
  } else if (totalOverdueInterest > 2000) {
    score -= 15;
    reasons.push(`Tiene L ${totalOverdueInterest.toFixed(2)} en intereses pendientes`);
  }

  if (onTimePaymentRate < 50) {
    score -= 30;
    reasons.push(`Solo paga a tiempo el ${onTimePaymentRate.toFixed(0)}% de las veces`);
  } else if (onTimePaymentRate < 75) {
    score -= 15;
    reasons.push(`Paga a tiempo el ${onTimePaymentRate.toFixed(0)}% de las veces (puede mejorar)`);
  } else if (onTimePaymentRate >= 95) {
    score += 10;
    reasons.push(`Excelente historial: paga a tiempo el ${onTimePaymentRate.toFixed(0)}% de las veces`);
  }

  if (avgDaysLate > 30) {
    score -= 20;
    reasons.push(`Se atrasa un promedio de ${Math.round(avgDaysLate)} días`);
  } else if (avgDaysLate > 15) {
    score -= 10;
    reasons.push(`Se atrasa un promedio de ${Math.round(avgDaysLate)} días`);
  }

  const defaultedLoans = activeLoans.filter(loan => {
    const state = calcLoanState(loan, client.rate, currentDate);
    return state.quincenas > 4 && state.pendingInterest > loan.principal * 0.5;
  }).length;

  if (defaultedLoans > 0) {
    score -= 40;
    reasons.push(`${defaultedLoans} préstamo(s) en situación crítica de impago`);
  }

  if (totalDebt > 50000) {
    score -= 20;
    reasons.push(`Deuda total muy alta: L ${totalDebt.toFixed(2)}`);
  } else if (totalDebt > 30000) {
    score -= 10;
    reasons.push(`Deuda total significativa: L ${totalDebt.toFixed(2)}`);
  }

  if (paidLoans.length > 3 && onTimePaymentRate > 85) {
    score += 15;
    reasons.push(`Ha pagado ${paidLoans.length} préstamos completamente con buen historial`);
  }

  score = Math.max(0, Math.min(100, score));

  let risk: 'bajo' | 'medio' | 'alto' | 'muy-alto';
  let shouldLend: boolean;
  let maxRecommendedLoan: number;
  let recommendation: string;

  if (score >= 80) {
    risk = 'bajo';
    shouldLend = true;
    maxRecommendedLoan = 20000;
    recommendation = 'Cliente confiable. Recomendado para préstamos hasta L 20,000. Buen historial de pago.';
  } else if (score >= 60) {
    risk = 'medio';
    shouldLend = true;
    maxRecommendedLoan = 10000;
    recommendation = 'Cliente aceptable. Recomendado para préstamos moderados hasta L 10,000. Monitorear de cerca.';
  } else if (score >= 40) {
    risk = 'alto';
    shouldLend = false;
    maxRecommendedLoan = 5000;
    recommendation = 'Riesgo elevado. Solo préstamos pequeños (máx L 5,000) y con garantías adicionales. Exigir pagos puntuales.';
  } else {
    risk = 'muy-alto';
    shouldLend = false;
    maxRecommendedLoan = 0;
    recommendation = 'NO RECOMENDADO prestar. Riesgo muy alto de impago. Resolver deudas pendientes primero.';
  }

  if (totalOverdueInterest > 3000 && activeLoans.length > 0) {
    shouldLend = false;
    recommendation = 'NO PRESTAR. Debe pagar los intereses vencidos antes de solicitar nuevo crédito.';
  }

  return {
    score,
    risk,
    recommendation,
    maxRecommendedLoan,
    shouldLend,
    reasons,
    paymentBehavior: {
      avgDaysLate,
      onTimePaymentRate,
      totalLoans,
      activeLoans: activeLoans.length,
      paidLoans: paidLoans.length,
      defaultedLoans
    }
  };
}
