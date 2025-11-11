import React, { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { User, Plus, Trash2, Calendar, DollarSign, CreditCard, Percent, TrendingUp, CreditCard as Edit2, FileDown, BarChart3, Calculator as CalcIcon, Database, Moon, Sun, Printer, Phone, FileText, Bell, Shield, Activity, PieChart, History, Handshake, PenTool, AlertCircle } from 'lucide-react';
import LoginForm from './components/LoginForm';
import Header from './components/Header';
import SeguridadYPoliticas from './components/SeguridadYPoliticas';
import Dashboard from './components/Dashboard';
import AdvancedSearch from './components/AdvancedSearch';
import NotificationBadge from './components/NotificationBadge';
import Calculator from './components/Calculator';
import BackupRestore from './components/BackupRestore';
import Charts from './components/Charts';
import CreditScore from './components/CreditScore';
import DocumentManager from './components/DocumentManager';
import WhatsAppReminders from './components/WhatsAppReminders';
import ManagerSignatureSetup from './components/ManagerSignatureSetup';
import FinancialDashboard from './components/FinancialDashboard';
import CollateralManager from './components/CollateralManager';
import ProfitabilityAnalysis from './components/ProfitabilityAnalysis';
import ComparativeAnalysis from './components/ComparativeAnalysis';
import UserActivityLog from './components/UserActivityLog';
import TwoFactorAuth from './components/TwoFactorAuth';
import DarkModeToggle from './components/DarkModeToggle';
import AcceptInvitePage from './components/AcceptInvitePage';
import { useAuth } from './hooks/useAuth';
import { useDarkMode } from './hooks/useDarkMode';
import * as api from './lib/api';
import { supabase } from './lib/supabase';
import { exportToCSV, exportClientToPDF, exportAllClientsToPDF } from './utils/exportUtils';
import ReceiptModal from './components/ReceiptModal';
import LoanReceiptModal from './components/LoanReceiptModal';
import QuincenasHistoryModal from './components/QuincenasHistoryModal';
import AccountStatementPDF from './components/AccountStatementPDF';
import DetailedAccountStatementPDF from './components/DetailedAccountStatementPDF';
import LoanContractPDF from './components/LoanContractPDF';
import PaymentNegotiation from './components/PaymentNegotiation';
import PaymentPlansModal from './components/PaymentPlansModal';
import EditClientModal from './components/EditClientModal';
import CollectionManager from './components/CollectionManager';
import InvitationManager from './components/InvitationManager';
import UserManagement from './components/UserManagement';
import AuditHistory from './components/AuditHistory';
import SimpleAuditHistory from './components/SimpleAuditHistory';
import ClientSignatureModal from './components/ClientSignatureModal';
import UntrackedClientsDropdown from './components/UntrackedClientsDropdown';
import { analyzeCreditBehavior } from './utils/creditAnalysis';

export interface Payment {
  id: string;
  date: string;
  amount: number;
}

export interface InterestPayment {
  id: string;
  date: string;
  amount: number;
}

export interface Loan {
  id: string;
  date: string;
  principal: number;
  payments: Payment[];
  interestPayments: InterestPayment[];
  unpaidInterest: number;
  status?: 'active' | 'paid' | 'overdue' | 'cancelled' | 'refinanced';
  collateralType?: 'vehicle' | 'property' | 'jewelry' | 'electronics' | 'other' | 'none';
  collateralDescription?: string;
  collateralValue?: number;
  collateralNotes?: string;
  dueDate?: string;
  daysOverdue?: number;
}

export interface Client {
  id: string;
  name: string;
  idNumber: string;
  nickname: string;
  phoneNumber?: string;
  rate: number;
  loans: Loan[];
  notes?: string;
  residenceAddress?: string;
  workplace?: string;
  workplaceAddress?: string;
  referenceName?: string;
  referencePhone?: string;
  referenceRelationship?: string;
  monthlySalary?: number;
  otherIncome?: number;
}

interface LoanState {
  outstanding: number;
  accruedInterest: number;
  quincenas: number;
}

function MainApp() {
  const { user, isLoading, login, logout, isAuthenticated } = useAuth();
  const { isDark, toggle: toggleDarkMode } = useDarkMode();
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [userOrganizationId, setUserOrganizationId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>('member');
  const [showPolicies, setShowPolicies] = useState(false);
  const [currentView, setCurrentView] = useState<'clients' | 'dashboard' | 'financial' | 'profitability' | 'comparative' | 'activity' | 'security' | 'team'>('clients');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showBackup, setShowBackup] = useState(false);
  const [showDocuments, setShowDocuments] = useState(false);
  const [showReminders, setShowReminders] = useState(false);
  const [showManagerSignatureSetup, setShowManagerSignatureSetup] = useState(false);
  const [showCollateralManager, setShowCollateralManager] = useState(false);
  const [selectedLoanForCollateral, setSelectedLoanForCollateral] = useState<{ client: Client; loan: Loan } | null>(null);
  const [showPaymentNegotiation, setShowPaymentNegotiation] = useState(false);
  const [negotiationData, setNegotiationData] = useState<{ client: Client; loan: Loan } | null>(null);
  const [showPaymentPlans, setShowPaymentPlans] = useState(false);
  const [paymentPlansClient, setPaymentPlansClient] = useState<Client | null>(null);
  const [showEditClient, setShowEditClient] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);
  const [showCollectionManager, setShowCollectionManager] = useState(false);
  const [clientToManage, setClientToManage] = useState<Client | null>(null);
  const [untrackedClients, setUntrackedClients] = useState<string[]>([]);
  const [dismissedUntrackedToday, setDismissedUntrackedToday] = useState(false);
  const [receiptData, setReceiptData] = useState<{
    client: Client;
    loan: Loan;
    payments: Array<{ amount: number; type: 'capital' | 'interest' }>;
    previousCapital: number;
    previousInterest: number;
    currentCapital: number;
    currentInterest: number;
  } | null>(null);
  const [loanReceiptData, setLoanReceiptData] = useState<{
    client: Client;
    loan: Loan;
  } | null>(null);
  const [quincenasHistoryData, setQuincenasHistoryData] = useState<{
    client: Client;
    loan: Loan;
  } | null>(null);
  const [signatureModalData, setSignatureModalData] = useState<{
    client: Client;
    loan: Loan;
  } | null>(null);

  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [formClient, setFormClient] = useState({
    name: '',
    idNumber: '',
    nickname: '',
    phoneNumber: '',
    rate: 14,
    notes: '',
    residenceAddress: '',
    workplace: '',
    workplaceAddress: '',
    referenceName: '',
    referencePhone: '',
    referenceRelationship: '',
    monthlySalary: 0,
    otherIncome: 0
  });
  const [loanForm, setLoanForm] = useState({
    amount: '',
    date: new Date().toISOString().slice(0, 10)
  });
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    date: new Date().toISOString().slice(0, 10)
  });
  const [interestPaymentForm, setInterestPaymentForm] = useState({
    amount: '',
    date: new Date().toISOString().slice(0, 10)
  });
  const [combinedPaymentForm, setCombinedPaymentForm] = useState({
    capitalAmount: '',
    interestAmount: '',
    date: new Date().toISOString().slice(0, 10)
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [editingLoan, setEditingLoan] = useState<{clientId: string; loanId: string} | null>(null);
  const [editingClient, setEditingClient] = useState<string | null>(null);
  const [editClientForm, setEditClientForm] = useState({
    name: '',
    idNumber: '',
    nickname: '',
    phoneNumber: '',
    rate: 14
  });
  const [editingLoanBasic, setEditingLoanBasic] = useState<{clientId: string; loanId: string} | null>(null);
  const [editLoanForm, setEditLoanForm] = useState({
    date: '',
    principal: '',
    unpaidInterest: ''
  });
  const [editForm, setEditForm] = useState({
    principal: '',
    unpaidInterest: '',
    interestRate: '',
    capitalRestante: '',
    interesAcumulado: '',
    pagosCapital: '',
    pagosInteres: '',
    interesPendiente: '',
    totalPendiente: '',
    quincenas: ''
  });

  // Load clients from Supabase when user is authenticated
  useEffect(() => {
    async function loadClients() {
      if (user && isAuthenticated) {
        try {
          setDataLoading(true);

          const orgId = await api.getUserOrganizationId();
          setUserOrganizationId(orgId);

          const { data: memberData } = await supabase
            .from('organization_members')
            .select('role')
            .eq('user_id', user.id)
            .maybeSingle();

          if (memberData) {
            setUserRole(memberData.role);
          }

          const clientsData = await api.fetchClients(user.id);
          setClients(clientsData);
          setFilteredClients(clientsData);
        } catch (error) {
          console.error('Error loading clients:', error);
          alert('Error al cargar los datos. Por favor recarga la página.');
        } finally {
          setDataLoading(false);
        }
      }
    }
    loadClients();
  }, [user, isAuthenticated]);

  // Real-time subscriptions for automatic updates
  useEffect(() => {
    if (!user || !isAuthenticated) return;

    const setupRealtimeSubscriptions = async () => {
      try {
        const orgId = await api.getUserOrganizationId();
        if (!orgId) return;

        const clientsChannel = supabase
          .channel('clients-changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'clients',
              filter: `organization_id=eq.${orgId}`
            },
            async (payload) => {
              console.log('Client change detected:', payload);
              try {
                const clientsData = await api.fetchClients(user.id);
                setClients(clientsData);
                setFilteredClients(clientsData);
              } catch (error) {
                console.error('Error reloading clients:', error);
              }
            }
          )
          .subscribe();

        const loansChannel = supabase
          .channel('loans-changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'loans',
              filter: `organization_id=eq.${orgId}`
            },
            async (payload) => {
              console.log('Loan change detected:', payload);
              try {
                const clientsData = await api.fetchClients(user.id);
                setClients(clientsData);
                setFilteredClients(clientsData);
              } catch (error) {
                console.error('Error reloading clients:', error);
              }
            }
          )
          .subscribe();

        const paymentsChannel = supabase
          .channel('payments-changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'payments',
              filter: `organization_id=eq.${orgId}`
            },
            async (payload) => {
              console.log('Payment change detected:', payload);
              try {
                const clientsData = await api.fetchClients(user.id);
                setClients(clientsData);
                setFilteredClients(clientsData);
              } catch (error) {
                console.error('Error reloading clients:', error);
              }
            }
          )
          .subscribe();

        const interestPaymentsChannel = supabase
          .channel('interest-payments-changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'interest_payments',
              filter: `organization_id=eq.${orgId}`
            },
            async (payload) => {
              console.log('Interest payment change detected:', payload);
              try {
                const clientsData = await api.fetchClients(user.id);
                setClients(clientsData);
                setFilteredClients(clientsData);
              } catch (error) {
                console.error('Error reloading clients:', error);
              }
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(clientsChannel);
          supabase.removeChannel(loansChannel);
          supabase.removeChannel(paymentsChannel);
          supabase.removeChannel(interestPaymentsChannel);
        };
      } catch (error) {
        console.error('Error setting up realtime subscriptions:', error);
      }
    };

    setupRealtimeSubscriptions();
  }, [user, isAuthenticated]);

  useEffect(() => {
    if (user && isAuthenticated && clients.length > 0) {
      loadUntrackedClients();
    }
  }, [user, isAuthenticated, clients]);

  async function loadUntrackedClients() {
    try {
      const untracked = await api.getClientsWithoutTracking();
      setUntrackedClients(untracked);
    } catch (error) {
      console.error('Error loading untracked clients:', error);
    }
  }

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const dismissedDate = localStorage.getItem('dismissedUntrackedDate');

    if (dismissedDate !== today) {
      setDismissedUntrackedToday(false);
      localStorage.removeItem('dismissedUntrackedDate');
    } else {
      setDismissedUntrackedToday(true);
    }
  }, []);

  const handleDismissUntracked = () => {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem('dismissedUntrackedDate', today);
    setDismissedUntrackedToday(true);
  };

  // Show loading screen while checking authentication or loading data
  if (isLoading || (isAuthenticated && dataLoading)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando sistema...</p>
        </div>
      </div>
    );
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return <LoginForm onLogin={login} />;
  }

  async function addClient() {
    if (!formClient.name.trim() || !formClient.idNumber.trim() || !user) return;

    try {
      const newClient = await api.createClient({
        user_id: user.id,
        name: formClient.name,
        rate: formClient.rate || 14,
        id_number: formClient.idNumber,
        nickname: formClient.nickname,
        phone_number: formClient.phoneNumber,
        notes: formClient.notes,
        residence_address: formClient.residenceAddress,
        workplace: formClient.workplace,
        workplace_address: formClient.workplaceAddress,
        reference_name: formClient.referenceName,
        reference_phone: formClient.referencePhone,
        reference_relationship: formClient.referenceRelationship,
        monthly_salary: formClient.monthlySalary,
        other_income: formClient.otherIncome
      });
      setClients(c => [newClient, ...c]);
      setFormClient({
        name: '',
        idNumber: '',
        nickname: '',
        phoneNumber: '',
        rate: 14,
        notes: '',
        residenceAddress: '',
        workplace: '',
        workplaceAddress: '',
        referenceName: '',
        referencePhone: '',
        referenceRelationship: '',
        monthlySalary: 0,
        otherIncome: 0
      });
      setSelectedClientId(newClient.id);
    } catch (error) {
      console.error('Error creating client:', error);
      alert('Error al crear el cliente. Por favor intenta de nuevo.');
    }
  }

  async function addLoan(clientId: string) {
    const amount = parseFloat(loanForm.amount);
    if (!amount || !loanForm.date || !user) return;

    try {
      const newLoan = await api.createLoan(user.id, clientId, amount, loanForm.date);
      const client = clients.find(c => c.id === clientId);

      setClients(list =>
        list.map(cl =>
          cl.id === clientId
            ? { ...cl, loans: [newLoan, ...cl.loans] }
            : cl
        )
      );
      setLoanForm({
        amount: '',
        date: new Date().toISOString().slice(0, 10)
      });

      if (client) {
        setLoanReceiptData({
          client,
          loan: newLoan
        });
      }
    } catch (error) {
      console.error('Error creating loan:', error);
      alert('Error al crear el préstamo. Por favor intenta de nuevo.');
    }
  }

  async function addPayment(clientId: string, loanId: string) {
    const amount = parseFloat(paymentForm.amount);
    if (!amount || !paymentForm.date) return;

    try {
      const client = clients.find(c => c.id === clientId);
      const loan = client?.loans.find(l => l.id === loanId);

      if (!client || !loan) return;

      const previousState = calcLoanState(loan, client.rate, new Date());
      const previousCapital = Math.max(0, loan.principal - loan.payments.reduce((sum, p) => sum + p.amount, 0));
      const previousInterest = previousState.accruedInterest - (loan.interestPayments || []).reduce((sum, p) => sum + p.amount, 0);

      const newPayment = await api.createPayment(loanId, 'capital', amount, paymentForm.date);

      const currentCapital = Math.max(0, previousCapital - amount);
      const currentInterest = previousInterest;

      setReceiptData({
        client,
        loan,
        payments: [{ amount, type: 'capital' }],
        previousCapital,
        previousInterest,
        currentCapital,
        currentInterest
      });

      setClients(list =>
        list.map(cl => {
          if (cl.id !== clientId) return cl;
          return {
            ...cl,
            loans: cl.loans.map(ln =>
              ln.id === loanId
                ? { ...ln, payments: [newPayment, ...ln.payments] }
                : ln
            )
          };
        })
      );
      setPaymentForm({
        amount: '',
        date: new Date().toISOString().slice(0, 10)
      });
    } catch (error) {
      console.error('Error creating payment:', error);
      alert('Error al crear el pago. Por favor intenta de nuevo.');
    }
  }

  async function addInterestPayment(clientId: string, loanId: string) {
    const amount = parseFloat(interestPaymentForm.amount);
    if (!amount || !interestPaymentForm.date) return;

    try {
      const client = clients.find(c => c.id === clientId);
      const loan = client?.loans.find(l => l.id === loanId);

      if (!client || !loan) return;

      const previousState = calcLoanState(loan, client.rate, new Date());
      const previousCapital = Math.max(0, loan.principal - loan.payments.reduce((sum, p) => sum + p.amount, 0));
      const previousInterest = previousState.accruedInterest - (loan.interestPayments || []).reduce((sum, p) => sum + p.amount, 0);

      const newPayment = await api.createPayment(loanId, 'interest', amount, interestPaymentForm.date);

      const currentCapital = previousCapital;
      const currentInterest = Math.max(0, previousInterest - amount);

      setReceiptData({
        client,
        loan,
        payments: [{ amount, type: 'interest' }],
        previousCapital,
        previousInterest,
        currentCapital,
        currentInterest
      });

      setClients(list =>
        list.map(cl => {
          if (cl.id !== clientId) return cl;
          return {
            ...cl,
            loans: cl.loans.map(ln => {
              if (ln.id !== loanId) return ln;
              let unpaid = ln.unpaidInterest || 0;

              if (amount >= unpaid) {
                unpaid = 0;
              } else {
                unpaid = unpaid - amount;
              }

              api.updateLoan(loanId, { unpaidInterest: unpaid }).catch(console.error);

              return {
                ...ln,
                interestPayments: [newPayment, ...ln.interestPayments],
                unpaidInterest: unpaid
              };
            })
          };
        })
      );

      setInterestPaymentForm({
        amount: '',
        date: new Date().toISOString().slice(0, 10)
      });
    } catch (error) {
      console.error('Error creating interest payment:', error);
      alert('Error al crear el pago de interés. Por favor intenta de nuevo.');
    }
  }

  async function addCombinedPayment(clientId: string, loanId: string) {
    const capitalAmount = parseFloat(combinedPaymentForm.capitalAmount);
    const interestAmount = parseFloat(combinedPaymentForm.interestAmount);

    if ((!capitalAmount && !interestAmount) || !combinedPaymentForm.date) return;

    try {
      const client = clients.find(c => c.id === clientId);
      const loan = client?.loans.find(l => l.id === loanId);

      if (!client || !loan) return;

      const previousState = calcLoanState(loan, client.rate, new Date());
      const previousCapital = Math.max(0, loan.principal - loan.payments.reduce((sum, p) => sum + p.amount, 0));
      const previousInterest = previousState.accruedInterest - (loan.interestPayments || []).reduce((sum, p) => sum + p.amount, 0);

      const paymentsToShow: Array<{ amount: number; type: 'capital' | 'interest' }> = [];

      if (capitalAmount > 0) {
        const newCapitalPayment = await api.createPayment(loanId, 'capital', capitalAmount, combinedPaymentForm.date);
        paymentsToShow.push({ amount: capitalAmount, type: 'capital' });

        setClients(list =>
          list.map(cl => {
            if (cl.id !== clientId) return cl;
            return {
              ...cl,
              loans: cl.loans.map(ln =>
                ln.id === loanId
                  ? { ...ln, payments: [newCapitalPayment, ...ln.payments] }
                  : ln
              )
            };
          })
        );
      }

      if (interestAmount > 0) {
        const newInterestPayment = await api.createPayment(loanId, 'interest', interestAmount, combinedPaymentForm.date);
        paymentsToShow.push({ amount: interestAmount, type: 'interest' });

        setClients(list =>
          list.map(cl => {
            if (cl.id !== clientId) return cl;
            return {
              ...cl,
              loans: cl.loans.map(ln => {
                if (ln.id !== loanId) return ln;
                let unpaid = ln.unpaidInterest || 0;

                if (interestAmount >= unpaid) {
                  unpaid = 0;
                } else {
                  unpaid = unpaid - interestAmount;
                }

                api.updateLoan(loanId, { unpaidInterest: unpaid }).catch(console.error);

                return {
                  ...ln,
                  interestPayments: [newInterestPayment, ...ln.interestPayments],
                  unpaidInterest: unpaid
                };
              })
            };
          })
        );
      }

      const currentCapital = Math.max(0, previousCapital - (capitalAmount || 0));
      const currentInterest = Math.max(0, previousInterest - (interestAmount || 0));

      setReceiptData({
        client,
        loan,
        payments: paymentsToShow,
        previousCapital,
        previousInterest,
        currentCapital,
        currentInterest
      });

      setCombinedPaymentForm({
        capitalAmount: '',
        interestAmount: '',
        date: new Date().toISOString().slice(0, 10)
      });
    } catch (error) {
      console.error('Error creating combined payment:', error);
      alert('Error al crear los pagos. Por favor intenta de nuevo.');
    }
  }

  function startEditingLoan(
    clientId: string,
    loanId: string,
    loan: Loan,
    currentRate: number,
    loanState: LoanState
  ) {
    const totalCapitalPaid = loan.payments.reduce((sum, p) => sum + p.amount, 0);
    const totalInterestPaid = loan.interestPayments.reduce((sum, p) => sum + p.amount, 0);
    const capitalRestante = Math.max(0, loan.principal - totalCapitalPaid);

    setEditingLoan({ clientId, loanId });
    setEditForm({
      principal: loan.principal.toString(),
      unpaidInterest: (loan.unpaidInterest || 0).toString(),
      interestRate: currentRate.toString(),
      capitalRestante: capitalRestante.toString(),
      interesAcumulado: loanState.accruedInterest.toString(),
      pagosCapital: totalCapitalPaid.toString(),
      pagosInteres: totalInterestPaid.toString(),
      interesPendiente: loanState.accruedInterest.toString(),
      totalPendiente: loanState.outstanding.toString(),
      quincenas: loanState.quincenas.toString()
    });
  }

  function cancelEditingLoan() {
    setEditingLoan(null);
    setEditForm({
      principal: '',
      unpaidInterest: '',
      interestRate: '',
      capitalRestante: '',
      interesAcumulado: '',
      pagosCapital: '',
      pagosInteres: '',
      interesPendiente: '',
      totalPendiente: '',
      quincenas: ''
    });
  }

  async function saveManualEdit() {
    if (!editingLoan) return;

    const newPrincipal = parseFloat(editForm.principal);
    const newUnpaidInterest = parseFloat(editForm.unpaidInterest);
    const newInterestRate = parseFloat(editForm.interestRate);

    if (isNaN(newPrincipal) || isNaN(newUnpaidInterest) || isNaN(newInterestRate) || newPrincipal < 0 || newUnpaidInterest < 0 || newInterestRate < 0) {
      alert('Por favor ingrese valores válidos (números positivos)');
      return;
    }

    try {
      await api.updateLoan(editingLoan.loanId, {
        principal: newPrincipal,
        unpaidInterest: newUnpaidInterest
      });
      await api.updateClient(editingLoan.clientId, { rate: newInterestRate });

      setClients(list =>
        list.map(cl => {
          if (cl.id !== editingLoan.clientId) return cl;
          return {
            ...cl,
            rate: newInterestRate,
            loans: cl.loans.map(ln => {
              if (ln.id !== editingLoan.loanId) return ln;
              return {
                ...ln,
                principal: newPrincipal,
                unpaidInterest: newUnpaidInterest
              };
            })
          };
        })
      );

      cancelEditingLoan();
    } catch (error) {
      console.error('Error updating loan:', error);
      alert('Error al actualizar el préstamo. Por favor intenta de nuevo.');
    }
  }

  async function updateClientInfo(clientId: string) {
    if (!editClientForm.name.trim()) return;

    try {
      await api.updateClient(clientId, {
        name: editClientForm.name.trim(),
        idNumber: editClientForm.idNumber.trim(),
        nickname: editClientForm.nickname.trim(),
        phoneNumber: editClientForm.phoneNumber.trim(),
        rate: editClientForm.rate
      });

      setClients(clients.map(c =>
        c.id === clientId
          ? { ...c, name: editClientForm.name.trim(), idNumber: editClientForm.idNumber.trim(), nickname: editClientForm.nickname.trim(), phoneNumber: editClientForm.phoneNumber.trim(), rate: editClientForm.rate }
          : c
      ));
      setEditingClient(null);
    } catch (error) {
      console.error('Error updating client:', error);
      alert('Error al actualizar el cliente. Por favor intenta de nuevo.');
    }
  }

  async function updateLoanBasicInfo(loanId: string, clientId: string) {
    const newPrincipal = parseFloat(editLoanForm.principal);
    const newUnpaidInterest = parseFloat(editLoanForm.unpaidInterest);

    if (isNaN(newPrincipal) || isNaN(newUnpaidInterest)) {
      alert('Por favor ingrese valores numéricos válidos');
      return;
    }

    try {
      await api.updateLoan(loanId, {
        principal: newPrincipal,
        unpaidInterest: newUnpaidInterest
      });

      setClients(clients.map(c => {
        if (c.id !== clientId) return c;
        return {
          ...c,
          loans: c.loans.map(ln =>
            ln.id === loanId
              ? { ...ln, date: editLoanForm.date, principal: newPrincipal, unpaidInterest: newUnpaidInterest }
              : ln
          )
        };
      }));
      setEditingLoanBasic(null);
    } catch (error) {
      console.error('Error updating loan:', error);
      alert('Error al actualizar el préstamo. Por favor intenta de nuevo.');
    }
  }

  async function deleteClient(id: string) {
    if (!confirm('¿Eliminar cliente y todos sus préstamos?')) return;

    try {
      await api.deleteClient(id);
      setClients(c => c.filter(x => x.id !== id));
      setSelectedClientId(null);
    } catch (error) {
      console.error('Error deleting client:', error);
      alert('Error al eliminar el cliente. Por favor intenta de nuevo.');
    }
  }

  function parseDate(d: string): Date {
    return new Date(d + 'T00:00:00');
  }

  function calcLoanState(loan: Loan, clientRate: number, asOf: Date = new Date()): LoanState {
    const INTEREST = clientRate / 100;
    const start = parseDate(loan.date);
    
    if (asOf < start) {
      return { outstanding: loan.principal, accruedInterest: 0, quincenas: 0 };
    }

    const payments = (loan.payments || [])
      .map(p => ({ ...p, dateObj: parseDate(p.date) }))
      .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

    let currentPrincipal = loan.principal;
    let accruedInterest = 0;
    const msPerQuincena = 15 * 24 * 60 * 60 * 1000;
    let periodStart = new Date(start);
    let quincenaCount = 0;

    // Create a copy of payments to avoid mutating the original array
    const remainingPayments = [...payments];

    while (periodStart.getTime() + msPerQuincena <= asOf.getTime()) {
      // Apply payments that occurred before or at the start of this period
      while (remainingPayments.length > 0 && remainingPayments[0].dateObj.getTime() <= periodStart.getTime()) {
        const p = remainingPayments.shift()!;
        currentPrincipal = Math.max(0, currentPrincipal - p.amount);
      }

      // Calculate interest for this quincea on current principal
      const interestThis = currentPrincipal * INTEREST;
      accruedInterest += interestThis;

      // Advance to next period
      periodStart = new Date(periodStart.getTime() + msPerQuincena);
      quincenaCount++;
    }

    // Apply remaining payments that happened before asOf
    while (remainingPayments.length > 0 && remainingPayments[0].dateObj.getTime() <= asOf.getTime()) {
      const p = remainingPayments.shift()!;
      currentPrincipal = Math.max(0, currentPrincipal - p.amount);
    }

    // Add unpaid interest from previous periods
    accruedInterest += (loan.unpaidInterest || 0);
    
    // Subtract interest payments made
    const totalInterestPaid = (loan.interestPayments || []).reduce((sum, p) => sum + p.amount, 0);
    accruedInterest = Math.max(0, accruedInterest - totalInterestPaid);
    const outstanding = Math.max(0, currentPrincipal + accruedInterest);
    return {
      outstanding: Number(outstanding.toFixed(2)),
      accruedInterest: Number(accruedInterest.toFixed(2)),
      quincenas: quincenaCount
    };
  }

  function clientTotals(client: Client) {
    const asOf = new Date();
    let totalOutstanding = 0;
    let totalPrincipal = 0;

    const clientLoans = client.loans || [];
    clientLoans.forEach(ln => {
      const st = calcLoanState(ln, client.rate, asOf);
      totalOutstanding += st.outstanding;
      totalPrincipal += ln.principal;
    });

    return {
      totalOutstanding: Number(totalOutstanding.toFixed(2)),
      totalPrincipal: Number(totalPrincipal.toFixed(2))
    };
  }

  // Format currency in Lempiras
  function formatLempiras(amount: number): string {
    return `L ${amount.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  // Filter clients based on search term
  function filterClients(clients: Client[], searchTerm: string): Client[] {
    const sortedClients = [...clients].sort((a, b) =>
      a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })
    );

    if (!searchTerm.trim()) return sortedClients;

    const term = searchTerm.toLowerCase().trim();

    return sortedClients.filter(client => {
      // Search in client basic info
      const nameMatch = client.name.toLowerCase().includes(term);
      const idMatch = client.idNumber.toLowerCase().includes(term);
      const nicknameMatch = client.nickname.toLowerCase().includes(term);

      // Search in loan amounts
      const clientLoans = client.loans || [];
      const loanMatch = clientLoans.some(loan =>
        loan.principal.toString().includes(term) ||
        formatLempiras(loan.principal).toLowerCase().includes(term)
      );

      return nameMatch || idMatch || nicknameMatch || loanMatch;
    });
  }

  const selectedClient = clients.find(c => c.id === selectedClientId);
  const displayClients = filterClients(filteredClients, searchTerm);

  const calculations = new Map<string, Map<string, any>>();
  clients.forEach(client => {
    const clientCalcs = new Map<string, any>();
    const clientLoans = client.loans || [];
    clientLoans.forEach(loan => {
      const loanState = calcLoanState(loan, client.rate, new Date());
      const loanPayments = loan.payments || [];
      const capitalPendiente = Math.max(0, loan.principal - loanPayments.reduce((s, p) => s + p.amount, 0));
      clientCalcs.set(loan.id, {
        quincenas: loanState.quincenas,
        capitalPendiente,
        interesAcumulado: loanState.accruedInterest,
        totalPendiente: loanState.outstanding,
        pagosTotalesCapital: loanPayments.reduce((s, p) => s + p.amount, 0),
        pagosTotalesInteres: (loan.interestPayments || []).reduce((s, p) => s + p.amount, 0)
      });
    });
    calculations.set(client.id, clientCalcs);
  });

  return (
    <div className={`min-h-screen ${isDark ? 'dark bg-gray-900' : 'bg-gradient-to-br from-slate-50 to-blue-50'}`}>
      <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 shadow-md">
        <div className="flex items-center gap-4">
          <Header
            userEmail={user!.email}
            onLogout={logout}
            onShowPolicies={() => setShowPolicies(true)}
          />
        </div>
        <div className="flex items-center gap-3">
          {untrackedClients.length > 0 && !dismissedUntrackedToday && (
            <UntrackedClientsDropdown
              untrackedClientIds={untrackedClients}
              allClients={clients}
              onSelectClient={(client) => {
                setClientToManage(client);
                setShowCollectionManager(true);
              }}
              onDismissAll={handleDismissUntracked}
            />
          )}
          <NotificationBadge clients={clients} calcLoanState={calcLoanState} />
          <button
            onClick={() => setShowCalculator(true)}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Calculadora"
          >
            <CalcIcon size={24} className="text-gray-700 dark:text-gray-300" />
          </button>
          <button
            onClick={() => setShowBackup(true)}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Respaldo"
          >
            <Database size={24} className="text-gray-700 dark:text-gray-300" />
          </button>
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title={isDark ? 'Modo claro' : 'Modo oscuro'}
          >
            {isDark ? <Sun size={24} className="text-yellow-400" /> : <Moon size={24} className="text-gray-700" />}
          </button>
        </div>
      </div>

      {showCalculator && <Calculator onClose={() => setShowCalculator(false)} />}
      {showBackup && (
        <BackupRestore
          clients={clients}
          onRestore={async (restoredClients) => {
            for (const client of restoredClients) {
              await api.createClient(user!.id, client.name, client.rate, client.idNumber, client.nickname, client.phoneNumber);
            }
            const newClients = await api.fetchClients(user!.id);
            setClients(newClients);
            setFilteredClients(newClients);
          }}
          onClose={() => setShowBackup(false)}
        />
      )}

      {showDocuments && selectedClientId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
            <DocumentManager
              clientId={selectedClientId}
              clientName={clients.find(c => c.id === selectedClientId)?.name || ''}
            />
            <div className="sticky bottom-0 bg-white border-t p-4">
              <button
                onClick={() => setShowDocuments(false)}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {showReminders && selectedClientId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
            <WhatsAppReminders
              clientId={selectedClientId}
              clientName={clients.find(c => c.id === selectedClientId)?.name || ''}
              clientPhone={clients.find(c => c.id === selectedClientId)?.phoneNumber}
              loans={clients.find(c => c.id === selectedClientId)?.loans || []}
              clientRate={clients.find(c => c.id === selectedClientId)?.rate || 14}
              formatLempiras={formatLempiras}
            />
            <div className="sticky bottom-0 bg-white border-t p-4">
              <button
                onClick={() => setShowReminders(false)}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {showCollateralManager && selectedLoanForCollateral && (
        <CollateralManager
          loan={selectedLoanForCollateral.loan}
          onUpdate={async (updates) => {
            await api.updateLoan(selectedLoanForCollateral.loan.id, {
              collateral_type: updates.collateralType,
              collateral_description: updates.collateralDescription,
              collateral_value: updates.collateralValue,
              collateral_notes: updates.collateralNotes
            });
            const clientsData = await api.fetchClients(user!.id);
            setClients(clientsData);
            setFilteredClients(clientsData);
          }}
          onClose={() => {
            setShowCollateralManager(false);
            setSelectedLoanForCollateral(null);
          }}
          isDark={isDark}
        />
      )}

      {showPaymentNegotiation && negotiationData && (
        <PaymentNegotiation
          client={negotiationData.client}
          loan={negotiationData.loan}
          formatLempiras={formatLempiras}
          onClose={() => {
            setShowPaymentNegotiation(false);
            setNegotiationData(null);
          }}
          onSuccess={async () => {
            try {
              const clientsData = await api.fetchClients(user!.id);
              setClients(clientsData);
              setFilteredClients(clientsData);
            } catch (error) {
              console.error('Error reloading clients:', error);
            }
          }}
        />
      )}

      {showPaymentPlans && paymentPlansClient && (
        <PaymentPlansModal
          client={paymentPlansClient}
          loans={paymentPlansClient.loans || []}
          onClose={() => {
            setShowPaymentPlans(false);
            setPaymentPlansClient(null);
          }}
          organizationName="Sistema de Préstamos"
        />
      )}

      {showManagerSignatureSetup && (
        <ManagerSignatureSetup
          onClose={() => setShowManagerSignatureSetup(false)}
          onSignatureSaved={async () => {
            try {
              const clientsData = await api.fetchClients(user!.id);
              setClients(clientsData);
              setFilteredClients(clientsData);
            } catch (error) {
              console.error('Error reloading clients:', error);
            }
          }}
        />
      )}

      {showEditClient && clientToEdit && (
        <EditClientModal
          client={clientToEdit}
          onClose={() => {
            setShowEditClient(false);
            setClientToEdit(null);
          }}
          onSave={async () => {
            const clientsData = await api.fetchClients(user!.id);
            setClients(clientsData);
            setFilteredClients(clientsData);
          }}
        />
      )}

      {showCollectionManager && clientToManage && (
        <CollectionManager
          client={clientToManage}
          onClose={() => {
            setShowCollectionManager(false);
            setClientToManage(null);
          }}
          onUpdate={async () => {
            try {
              const untracked = await api.getClientsWithoutTracking();
              setUntrackedClients(untracked);
              const clientsData = await api.fetchClients(user!.id);
              setClients(clientsData);
              setFilteredClients(clientsData);
            } catch (error) {
              console.error('Error updating data:', error);
            }
          }}
        />
      )}

      {receiptData && (
        <ReceiptModal
          client={receiptData.client}
          loan={receiptData.loan}
          payments={receiptData.payments}
          formatLempiras={formatLempiras}
          onClose={() => setReceiptData(null)}
          previousCapital={receiptData.previousCapital}
          previousInterest={receiptData.previousInterest}
          currentCapital={receiptData.currentCapital}
          currentInterest={receiptData.currentInterest}
        />
      )}

      {loanReceiptData && (
        <LoanReceiptModal
          client={loanReceiptData.client}
          loan={loanReceiptData.loan}
          formatLempiras={formatLempiras}
          onClose={() => setLoanReceiptData(null)}
        />
      )}

      {quincenasHistoryData && (
        <QuincenasHistoryModal
          client={quincenasHistoryData.client}
          loan={quincenasHistoryData.loan}
          formatLempiras={formatLempiras}
          onClose={() => setQuincenasHistoryData(null)}
        />
      )}

      {signatureModalData && (
        <ClientSignatureModal
          loanId={signatureModalData.loan.id}
          clientId={signatureModalData.client.id}
          clientName={signatureModalData.client.name}
          onClose={() => setSignatureModalData(null)}
          onSaved={async () => {
            try {
              const clientsData = await api.fetchClients(user!.id);
              setClients(clientsData);
              setFilteredClients(clientsData);
            } catch (error) {
              console.error('Error reloading clients:', error);
            }
          }}
        />
      )}

      {showPolicies && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowPolicies(false)}
              className="absolute top-4 right-4 z-10 bg-white hover:bg-gray-100 text-gray-800 rounded-full p-2 shadow-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <SeguridadYPoliticas />
          </div>
        </div>
      )}
      
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                  <CreditCard className="text-indigo-600" size={32} />
                  Sistema Financiero Avanzado - Lempiras (L)
                </h1>
                <p className="text-gray-600">Gestión de préstamos en Lempiras con tasas personalizables y pagos de interés separados</p>
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 shadow-md"
                >
                  <FileDown size={20} />
                  Exportar
                </button>
                {showExportMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl z-50 border border-gray-200">
                    <div className="py-2">
                      <button
                        onClick={() => { exportToCSV(clients, calculations, formatLempiras); setShowExportMenu(false); }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors flex items-center gap-2 text-sm"
                      >
                        <FileDown size={16} />
                        Exportar todo a CSV
                      </button>
                      <button
                        onClick={() => {
                          if (selectedClient) {
                            const clientCalcs = calculations.get(selectedClient.id);
                            if (clientCalcs) exportClientToPDF(selectedClient, clientCalcs, formatLempiras);
                          } else alert('Selecciona un cliente');
                          setShowExportMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors flex items-center gap-2 text-sm"
                      >
                        <FileDown size={16} />
                        Exportar cliente a PDF
                      </button>
                      <button
                        onClick={() => { exportAllClientsToPDF(clients, calculations, formatLempiras); setShowExportMenu(false); }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors flex items-center gap-2 text-sm"
                      >
                        <FileDown size={16} />
                        Exportar todos a PDF
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 mb-6 flex-wrap">
              <button
                onClick={() => setCurrentView('dashboard')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  currentView === 'dashboard' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <BarChart3 size={18} />
                Dashboard
              </button>
              <button
                onClick={() => setCurrentView('financial')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  currentView === 'financial' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Activity size={18} />
                Financiero
              </button>
              <button
                onClick={() => setCurrentView('profitability')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  currentView === 'profitability' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <PieChart size={18} />
                Rentabilidad
              </button>
              <button
                onClick={() => setCurrentView('comparative')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  currentView === 'comparative' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <TrendingUp size={18} />
                Comparativas
              </button>
              <button
                onClick={() => setCurrentView('clients')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  currentView === 'clients' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <User size={18} />
                Clientes
              </button>
              <button
                onClick={() => setCurrentView('activity')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  currentView === 'activity' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <History size={18} />
                Actividad
              </button>
              <button
                onClick={() => setCurrentView('security')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  currentView === 'security' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Shield size={18} />
                Seguridad
              </button>
              <button
                onClick={() => setCurrentView('team')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  currentView === 'team' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <User size={18} />
                Mi Equipo
              </button>
              <DarkModeToggle />
            </div>
          </div>

          {currentView === 'dashboard' && (
            <>
              <Dashboard
                clients={clients}
                calcLoanState={calcLoanState}
                formatLempiras={formatLempiras}
              />
              <div className="mt-6">
                <Charts
                  clients={clients}
                  calcLoanState={calcLoanState}
                  formatLempiras={formatLempiras}
                />
              </div>
              <div className="mt-6">
                <SimpleAuditHistory />
              </div>
            </>
          )}

          {currentView === 'financial' && (
            <FinancialDashboard clients={clients} isDark={isDark} />
          )}

          {currentView === 'profitability' && (
            <ProfitabilityAnalysis
              clients={clients}
              calcLoanState={calcLoanState}
              formatLempiras={formatLempiras}
            />
          )}

          {currentView === 'comparative' && (
            <ComparativeAnalysis
              clients={clients}
              calcLoanState={calcLoanState}
              formatLempiras={formatLempiras}
            />
          )}

          {currentView === 'activity' && (
            <AuditHistory />
          )}

          {currentView === 'security' && (
            <div className="space-y-6">
              <TwoFactorAuth />

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                  <PenTool size={20} />
                  Firma Digital del Gerente
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Configure su firma una vez y se incluirá automáticamente en todos los contratos PDF.
                </p>
                <button
                  onClick={() => setShowManagerSignatureSetup(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md"
                >
                  <PenTool size={20} />
                  Configurar Firma del Gerente
                </button>
              </div>
            </div>
          )}

          {currentView === 'team' && userOrganizationId && (
            <div className="space-y-6">
              <UserManagement />
              <AuditHistory />
            </div>
          )}

          {currentView === 'clients' && (
            <>
              <AdvancedSearch
                clients={clients}
                onFilter={setFilteredClients}
                calcLoanState={calcLoanState}
              />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Client Management Panel */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <User size={20} className="text-indigo-600" />
                  Nuevo Cliente
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
                    <input
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      placeholder="Ingresa el nombre"
                      value={formClient.name}
                      onChange={(e) => setFormClient({ ...formClient, name: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Número de identidad</label>
                    <input
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      placeholder="ID o cédula"
                      value={formClient.idNumber}
                      onChange={(e) => setFormClient({ ...formClient, idNumber: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sobrenombre (opcional)</label>
                    <input
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      placeholder="Apodo o alias"
                      value={formClient.nickname}
                      onChange={(e) => setFormClient({ ...formClient, nickname: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                      <Phone size={16} />
                      Número de Celular (opcional)
                    </label>
                    <input
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      type="tel"
                      placeholder="Ej: +504 9999-9999"
                      value={formClient.phoneNumber}
                      onChange={(e) => setFormClient({ ...formClient, phoneNumber: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                      <Percent size={16} />
                      Tasa de interés quincenal
                    </label>
                    <input
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      type="number"
                      step="0.1"
                      placeholder="L 0.00"
                      value={formClient.rate}
                      onChange={(e) => setFormClient({ ...formClient, rate: parseFloat(e.target.value) || 14 })}
                    />
                    <p className="text-xs text-gray-500 mt-1">Porcentaje por quincena (cada 15 días)</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dirección de residencia (opcional)</label>
                    <input
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      placeholder="Ej: Col. Kennedy, Bloque 12, Casa 5"
                      value={formClient.residenceAddress}
                      onChange={(e) => setFormClient({ ...formClient, residenceAddress: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Lugar de trabajo (opcional)</label>
                    <input
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      placeholder="Ej: Empresa ABC, S.A."
                      value={formClient.workplace}
                      onChange={(e) => setFormClient({ ...formClient, workplace: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dirección del trabajo (opcional)</label>
                    <input
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      placeholder="Ej: Zona Industrial, Edificio 3"
                      value={formClient.workplaceAddress}
                      onChange={(e) => setFormClient({ ...formClient, workplaceAddress: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de referencia (opcional)</label>
                    <input
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      placeholder="Ej: María López"
                      value={formClient.referenceName}
                      onChange={(e) => setFormClient({ ...formClient, referenceName: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono de referencia (opcional)</label>
                    <input
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      type="tel"
                      placeholder="Ej: +504 9999-9999"
                      value={formClient.referencePhone}
                      onChange={(e) => setFormClient({ ...formClient, referencePhone: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Relación con la referencia (opcional)</label>
                    <input
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      placeholder="Ej: Amigo, Familiar, Compañero de trabajo"
                      value={formClient.referenceRelationship}
                      onChange={(e) => setFormClient({ ...formClient, referenceRelationship: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Salario mensual (opcional)</label>
                    <input
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      type="number"
                      step="0.01"
                      placeholder="L 0.00"
                      value={formClient.monthlySalary || ''}
                      onChange={(e) => setFormClient({ ...formClient, monthlySalary: parseFloat(e.target.value) || 0 })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Otros ingresos (opcional)</label>
                    <input
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      type="number"
                      step="0.01"
                      placeholder="L 0.00"
                      value={formClient.otherIncome || ''}
                      onChange={(e) => setFormClient({ ...formClient, otherIncome: parseFloat(e.target.value) || 0 })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notas (opcional)</label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      placeholder="Ej: Paga los viernes, llamar antes de visitar..."
                      rows={3}
                      value={formClient.notes}
                      onChange={(e) => setFormClient({ ...formClient, notes: e.target.value })}
                    />
                  </div>

                  <button
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    onClick={addClient}
                  >
                    <Plus size={18} />
                    Agregar Cliente
                  </button>
                </div>
              </div>

              {/* Client List */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">
                  Clientes ({clients.length})
                  </h2>
                </div>
                
                {/* Search Bar */}
                <div className="mb-4">
                  <div className="relative">
                    <input
                      className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      placeholder="Buscar por nombre, identidad, sobrenombre o monto..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                  {searchTerm && (
                    <p className="text-sm text-gray-500 mt-2">
                      Mostrando {displayClients.length} de {clients.length} clientes
                    </p>
                  )}
                </div>
                
                {displayClients.length === 0 && clients.length === 0 ? (
                  <div className="text-center py-8">
                    <User size={48} className="text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">No hay clientes registrados</p>
                  </div>
                ) : displayClients.length === 0 ? (
                  <div className="text-center py-8">
                    <User size={48} className="text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">No se encontraron clientes que coincidan con "{searchTerm}"</p>
                    <button
                      className="mt-2 text-indigo-600 hover:text-indigo-700 text-sm"
                      onClick={() => setSearchTerm('')}
                    >
                      Limpiar búsqueda
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {displayClients.map((client) => {
                      const totals = clientTotals(client);
                      const isSelected = selectedClientId === client.id;
                      
                      return (
                        <div
                          key={client.id}
                          className={`p-4 rounded-lg border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-50 border-indigo-200 shadow-md'
                              : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900">
                                {client.name}
                                {client.nickname && (
                                  <span className="text-gray-500 font-normal"> ({client.nickname})</span>
                                )}
                              </h3>
                              <p className="text-sm text-gray-600">ID: {client.idNumber}</p>
                              <p className="text-sm text-gray-600 flex items-center gap-1">
                                <Percent size={12} />
                                Tasa: {client.rate}% quincenal
                              </p>
                              <p className="text-sm text-gray-600">Préstamos: {(client.loans || []).length}</p>
                              {client.notes && (
                                <p className="text-xs text-blue-600 italic mt-1 bg-blue-50 px-2 py-1 rounded">
                                  📝 {client.notes}
                                </p>
                              )}
                              <p className="text-sm font-semibold text-emerald-600 mt-1">
                                Pendiente: {formatLempiras(totals.totalOutstanding)}
                              </p>

                              {(client.loans || []).length > 0 && (() => {
                                const analysis = analyzeCreditBehavior(client);
                                const getRiskBadgeColor = () => {
                                  switch (analysis.risk) {
                                    case 'bajo': return 'bg-green-100 text-green-800 border-green-300';
                                    case 'medio': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
                                    case 'alto': return 'bg-orange-100 text-orange-800 border-orange-300';
                                    case 'muy-alto': return 'bg-red-100 text-red-800 border-red-300';
                                  }
                                };
                                return (
                                  <div className={`mt-2 px-2 py-1 rounded-md border text-xs font-semibold ${getRiskBadgeColor()}`}>
                                    Riesgo: {analysis.risk.toUpperCase()} - Score: {analysis.score}
                                  </div>
                                );
                              })()}
                            </div>

                            <div className="flex flex-col gap-2">
                              <button
                                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm transition-colors"
                                onClick={() => setSelectedClientId(client.id)}
                              >
                                {isSelected ? 'Abierto' : 'Abrir'}
                              </button>
                              <button
                                className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm transition-colors flex items-center gap-1 justify-center"
                                onClick={() => {
                                  setClientToEdit(client);
                                  setShowEditClient(true);
                                }}
                              >
                                <Edit2 size={12} />
                                Editar
                              </button>
                              <button
                                className={`px-3 py-1 rounded-md text-sm transition-colors flex items-center gap-1 justify-center ${
                                  untrackedClients.includes(client.id)
                                    ? 'bg-orange-500 hover:bg-orange-600 text-white animate-pulse'
                                    : 'bg-green-500 hover:bg-green-600 text-white'
                                }`}
                                onClick={() => {
                                  setClientToManage(client);
                                  setShowCollectionManager(true);
                                }}
                              >
                                <DollarSign size={12} />
                                {untrackedClients.includes(client.id) ? 'Gestionar' : 'Cobro'}
                              </button>
                              <button
                                className="px-3 py-1 bg-purple-500 hover:bg-purple-600 text-white rounded-md text-sm transition-colors flex items-center gap-1 justify-center"
                                onClick={() => {
                                  setPaymentPlansClient(client);
                                  setShowPaymentPlans(true);
                                }}
                                title="Ver Planes de Negociación"
                              >
                                <FileText size={12} />
                                Planes
                              </button>
                              <button
                                className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-md text-sm transition-colors flex items-center gap-1 justify-center"
                                onClick={() => deleteClient(client.id)}
                              >
                                <Trash2 size={12} />
                                Borrar
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Client Details Panel */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-lg p-6">
                {!selectedClient ? (
                  <div className="text-center py-16">
                    <CreditCard size={64} className="text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">Selecciona un cliente para gestionar sus préstamos</p>
                  </div>
                ) : (
                  <div>
                    {/* Client Header */}
                    <div className="flex justify-between items-center pb-6 border-b border-gray-200">
                      <div className="flex-1">
                        {editingClient === selectedClient.id ? (
                          <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 space-y-3">
                            <h3 className="text-sm font-semibold text-blue-800 mb-2">Editar Información del Cliente</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Nombre completo</label>
                                <input
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                  value={editClientForm.name}
                                  onChange={(e) => setEditClientForm({ ...editClientForm, name: e.target.value })}
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Número de identidad</label>
                                <input
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                  value={editClientForm.idNumber}
                                  onChange={(e) => setEditClientForm({ ...editClientForm, idNumber: e.target.value })}
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Apodo</label>
                                <input
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                  value={editClientForm.nickname}
                                  onChange={(e) => setEditClientForm({ ...editClientForm, nickname: e.target.value })}
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Número de Celular</label>
                                <input
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                  type="tel"
                                  placeholder="+504 9999-9999"
                                  value={editClientForm.phoneNumber}
                                  onChange={(e) => setEditClientForm({ ...editClientForm, phoneNumber: e.target.value })}
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Tasa de interés (%)</label>
                                <input
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                  type="number"
                                  step="0.01"
                                  value={editClientForm.rate}
                                  onChange={(e) => setEditClientForm({ ...editClientForm, rate: parseFloat(e.target.value) || 0 })}
                                />
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => updateClientInfo(selectedClient.id)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                              >
                                Guardar Cambios
                              </button>
                              <button
                                onClick={() => setEditingClient(null)}
                                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors text-sm"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2">
                              <h2 className="text-2xl font-bold text-gray-900">
                                {selectedClient.name}
                                {selectedClient.nickname && (
                                  <span className="text-gray-600 font-normal"> ({selectedClient.nickname})</span>
                                )}
                              </h2>
                              <button
                                onClick={() => {
                                  setEditingClient(selectedClient.id);
                                  setEditClientForm({
                                    name: selectedClient.name,
                                    idNumber: selectedClient.idNumber,
                                    nickname: selectedClient.nickname,
                                    phoneNumber: selectedClient.phoneNumber || '',
                                    rate: selectedClient.rate
                                  });
                                }}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="Editar información del cliente"
                              >
                                <Edit2 size={18} />
                              </button>
                            </div>
                            <p className="text-gray-600">ID: {selectedClient.idNumber}</p>
                            <p className="text-gray-600 flex items-center gap-1 mt-1">
                              <TrendingUp size={16} />
                              Tasa: {selectedClient.rate}% quincenal
                            </p>
                            <p className="text-lg font-semibold text-emerald-600 mt-1">
                              Total pendiente: {formatLempiras(clientTotals(selectedClient).totalOutstanding)}
                            </p>
                          </>
                        )}
                      </div>
                      <button
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                        onClick={() => setSelectedClientId(null)}
                      >
                        Cerrar
                      </button>
                    </div>

                    {/* New Loan Form */}
                    <div className="py-6 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <Plus size={20} className="text-emerald-600" />
                        Nuevo Préstamo
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Monto (L.)</label>
                          <input
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                            placeholder="L 0.00"
                            value={loanForm.amount}
                            onChange={(e) => setLoanForm({ ...loanForm, amount: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                          <input
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                            type="date"
                            value={loanForm.date}
                            onChange={(e) => setLoanForm({ ...loanForm, date: e.target.value })}
                          />
                        </div>
                        <div className="flex items-end">
                          <button
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                            onClick={() => addLoan(selectedClient.id)}
                          >
                            Agregar Préstamo
                          </button>
                        </div>
                      </div>
                      
                      <div className="mt-2 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                        <strong>Nota:</strong> Interés del {selectedClient.rate}% por quincena (cada 15 días). Montos en Lempiras (L).
                      </div>
                    </div>

                    {/* Document Management and Reminders Buttons */}
                    <div className="pt-6 pb-6 border-b border-gray-200 space-y-3">
                      <div className="grid grid-cols-1 gap-3">
                        <DetailedAccountStatementPDF
                          client={selectedClient}
                          formatLempiras={formatLempiras}
                        />
                        <AccountStatementPDF
                          client={selectedClient}
                          calcLoanState={calcLoanState}
                          formatLempiras={formatLempiras}
                        />
                      </div>
                      <button
                        onClick={() => setShowDocuments(true)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <FileText size={20} />
                        Ver/Subir Documentos (Cédula, Contratos, Pagarés)
                      </button>
                      <button
                        onClick={() => setShowReminders(true)}
                        className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <Bell size={20} />
                        Recordatorios WhatsApp
                      </button>
                    </div>

                    {/* Credit Analysis */}
                    {selectedClient.loans.length > 0 && (
                      <div className="pt-6 pb-6">
                        <CreditScore
                          analysis={analyzeCreditBehavior(selectedClient)}
                          formatLempiras={formatLempiras}
                        />
                      </div>
                    )}

                    {/* Loans List */}
                    <div className="pt-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <DollarSign size={20} className="text-emerald-600" />
                        Préstamos ({selectedClient.loans.length})
                      </h3>

                      {selectedClient.loans.length === 0 ? (
                        <div className="text-center py-8 bg-gray-50 rounded-lg">
                          <p className="text-gray-500">Este cliente no tiene préstamos registrados</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {selectedClient.loans.map((loan) => {
                            const loanState = calcLoanState(loan, selectedClient.rate, new Date());
                            const isEditing = editingLoan?.loanId === loan.id;

                            return (
                              <div key={loan.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                  <div>
                                    {editingLoanBasic?.loanId === loan.id ? (
                                      <div className="mb-4 p-4 bg-green-50 border-2 border-green-300 rounded-lg">
                                        <h5 className="text-sm font-semibold text-green-800 mb-3">Editar Datos del Préstamo</h5>
                                        <div className="space-y-3">
                                          <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Fecha del préstamo</label>
                                            <input
                                              type="date"
                                              value={editLoanForm.date}
                                              onChange={(e) => setEditLoanForm({ ...editLoanForm, date: e.target.value })}
                                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Capital (L)</label>
                                            <input
                                              type="number"
                                              step="0.01"
                                              value={editLoanForm.principal}
                                              onChange={(e) => setEditLoanForm({ ...editLoanForm, principal: e.target.value })}
                                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Interés no pagado (L)</label>
                                            <input
                                              type="number"
                                              step="0.01"
                                              value={editLoanForm.unpaidInterest}
                                              onChange={(e) => setEditLoanForm({ ...editLoanForm, unpaidInterest: e.target.value })}
                                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                            />
                                          </div>
                                          <div className="flex gap-2">
                                            <button
                                              onClick={() => updateLoanBasicInfo(loan.id, selectedClient.id)}
                                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                                            >
                                              Guardar
                                            </button>
                                            <button
                                              onClick={() => setEditingLoanBasic(null)}
                                              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors text-sm"
                                            >
                                              Cancelar
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                                        <Calendar size={18} className="text-gray-600" />
                                        <span className="text-lg font-semibold text-gray-900">
                                          {formatLempiras(loan.principal)}
                                        </span>
                                        <span className="text-gray-600">• {loan.date}</span>
                                        {loan.status && (
                                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                            loan.status === 'active' ? 'bg-green-100 text-green-800' :
                                            loan.status === 'paid' ? 'bg-blue-100 text-blue-800' :
                                            loan.status === 'overdue' ? 'bg-red-100 text-red-800' :
                                            loan.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                                            'bg-yellow-100 text-yellow-800'
                                          }`}>
                                            {loan.status === 'active' ? 'Activo' :
                                             loan.status === 'paid' ? 'Pagado' :
                                             loan.status === 'overdue' ? 'Moroso' :
                                             loan.status === 'cancelled' ? 'Cancelado' :
                                             'Refinanciado'}
                                          </span>
                                        )}
                                        <button
                                          onClick={() => {
                                            setSelectedLoanForCollateral({ client: selectedClient, loan });
                                            setShowCollateralManager(true);
                                          }}
                                          className="ml-1 p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                          title="Gestionar garantía"
                                        >
                                          <Shield size={16} />
                                        </button>
                                        <button
                                          onClick={() => {
                                            setNegotiationData({ client: selectedClient, loan });
                                            setShowPaymentNegotiation(true);
                                          }}
                                          className="ml-1 p-1.5 text-purple-600 hover:bg-purple-50 rounded transition-colors"
                                          title="Negociar Plan de Pago"
                                        >
                                          <Handshake size={16} />
                                        </button>
                                        <button
                                          onClick={() => {
                                            setEditingLoanBasic({ clientId: selectedClient.id, loanId: loan.id });
                                            setEditLoanForm({
                                              date: loan.date,
                                              principal: loan.principal.toString(),
                                              unpaidInterest: (loan.unpaidInterest || 0).toString()
                                            });
                                          }}
                                          className="ml-1 p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                                          title="Editar fecha, capital e interés"
                                        >
                                          <Edit2 size={16} />
                                        </button>
                                        <LoanContractPDF
                                          client={selectedClient}
                                          loan={loan}
                                          formatLempiras={formatLempiras}
                                        />
                                        <button
                                          onClick={() => setSignatureModalData({ client: selectedClient, loan })}
                                          className="ml-1 p-1.5 text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                          title="Firma digital del cliente"
                                        >
                                          <PenTool size={16} />
                                        </button>
                                        <button
                                          onClick={() => setQuincenasHistoryData({ client: selectedClient, loan })}
                                          className="ml-1 p-1.5 text-purple-600 hover:bg-purple-50 rounded transition-colors"
                                          title="Ver historial de quincenas"
                                        >
                                          <FileText size={16} />
                                        </button>
                                        {!isEditing && (
                                          <button
                                            onClick={() => startEditingLoan(
                                              selectedClient.id,
                                              loan.id,
                                              loan,
                                              selectedClient.rate,
                                              loanState
                                            )}
                                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                            title="Edición avanzada de valores"
                                          >
                                            <Edit2 size={16} />
                                          </button>
                                        )}
                                      </div>
                                    )}

                                    {isEditing && (
                                      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                        <h5 className="text-sm font-semibold text-blue-800 mb-3 flex items-center gap-2">
                                          <Edit2 size={16} />
                                          Edición Manual de Valores
                                        </h5>
                                        <div className="space-y-3">
                                          <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                              Capital (L)
                                            </label>
                                            <input
                                              type="number"
                                              step="0.01"
                                              value={editForm.principal}
                                              onChange={(e) => setEditForm({ ...editForm, principal: e.target.value })}
                                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                                              placeholder="0.00"
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                              Interés No Pagado (L)
                                            </label>
                                            <input
                                              type="number"
                                              step="0.01"
                                              value={editForm.unpaidInterest}
                                              onChange={(e) => setEditForm({ ...editForm, unpaidInterest: e.target.value })}
                                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                                              placeholder="0.00"
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                                              <Percent size={12} />
                                              Tasa de Interés (%)
                                            </label>
                                            <input
                                              type="number"
                                              step="0.1"
                                              value={editForm.interestRate}
                                              onChange={(e) => setEditForm({ ...editForm, interestRate: e.target.value })}
                                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                                              placeholder="14.0"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">Tasa quincenal (cada 15 días)</p>
                                          </div>
                                          <div className="flex gap-2">
                                            <button
                                              onClick={saveManualEdit}
                                              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
                                            >
                                              Guardar
                                            </button>
                                            <button
                                              onClick={cancelEditingLoan}
                                              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-lg text-sm font-medium transition-colors"
                                            >
                                              Cancelar
                                            </button>
                                          </div>
                                        </div>
                                        <div className="mt-3 text-xs text-blue-700 bg-blue-100 p-2 rounded">
                                          <strong>Nota:</strong> Esta edición modifica directamente los valores. Use con precaución.
                                        </div>
                                      </div>
                                    )}
                                    
                                    <div className="space-y-2">
                                      <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Quincenas completas:</span>
                                        <span className="font-medium">{loanState.quincenas}</span>
                                      </div>
                                      <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Capital original:</span>
                                        <span className="font-medium">{formatLempiras(loan.principal)}</span>
                                      </div>
                                      <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Pagos a capital:</span>
                                        <span className="font-medium text-green-600">
                                          -{formatLempiras(loan.payments.reduce((sum, p) => sum + p.amount, 0))}
                                        </span>
                                      </div>
                                      <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Capital restante:</span>
                                        <span className="font-medium text-blue-600">
                                          {formatLempiras(Math.max(0, loan.principal - loan.payments.reduce((sum, p) => sum + p.amount, 0)))}
                                        </span>
                                      </div>
                                      <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Interés acumulado:</span>
                                        <span className="font-medium text-orange-600">{formatLempiras(loanState.accruedInterest)}</span>
                                      </div>
                                      <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Pagos de interés:</span>
                                        <span className="font-medium text-green-600">
                                          -{formatLempiras(loan.interestPayments.reduce((sum, p) => sum + p.amount, 0))}
                                        </span>
                                      </div>
                                      <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Interés pendiente:</span>
                                        <span className="font-medium text-red-600">{formatLempiras(loanState.accruedInterest)}</span>
                                      </div>
                                      <div className="flex justify-between text-base font-semibold border-t pt-2">
                                        <span>Total pendiente:</span>
                                        <span className="text-emerald-600">{formatLempiras(loanState.outstanding)}</span>
                                      </div>
                                    </div>

                                    {/* Interest History Column */}
                                    <div className="bg-orange-50 rounded-lg p-4">
                                      <h5 className="text-lg font-semibold text-orange-800 mb-3 flex items-center gap-2">
                                        <Percent size={18} />
                                        Historial de Interés
                                      </h5>
                                      
                                      <div className="space-y-3 max-h-80 overflow-y-auto">
                                        {/* Interest payments */}
                                        {loan.interestPayments
                                          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                                          .map((payment, index) => {
                                            // Calculate interest pending after this payment
                                            const loanStateAtPayment = calcLoanState(loan, selectedClient.rate, new Date(payment.date));
                                            const interestPaymentsUpToThis = loan.interestPayments
                                              .filter(p => new Date(p.date) <= new Date(payment.date))
                                              .reduce((sum, p) => sum + p.amount, 0);
                                            const interestPending = Math.max(0, loanStateAtPayment.accruedInterest - interestPaymentsUpToThis);
                                            
                                            return (
                                              <div key={payment.id} className="bg-white rounded-lg p-3 border border-orange-200">
                                                <div className="flex justify-between items-center mb-2">
                                                  <span className="text-sm font-medium text-gray-700">{payment.date}</span>
                                                  <div className="flex items-center gap-2">
                                                    <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                                                      Pago de Interés
                                                    </span>
                                                    <button
                                                      onClick={() => {
                                                        const prevState = calcLoanState(loan, selectedClient.rate, new Date(payment.date));
                                                        const prevCap = Math.max(0, loan.principal - loan.payments.filter(p => new Date(p.date) < new Date(payment.date)).reduce((s, p) => s + p.amount, 0));
                                                        const prevInt = prevState.accruedInterest - loan.interestPayments.filter(p => new Date(p.date) < new Date(payment.date)).reduce((s, p) => s + p.amount, 0);
                                                        setReceiptData({
                                                          client: selectedClient,
                                                          loan,
                                                          payments: [{ amount: payment.amount, type: 'interest' }],
                                                          previousCapital: prevCap,
                                                          previousInterest: prevInt,
                                                          currentCapital: prevCap,
                                                          currentInterest: Math.max(0, prevInt - payment.amount)
                                                        });
                                                      }}
                                                      className="p-1 hover:bg-orange-100 rounded transition-colors"
                                                      title="Ver recibo"
                                                    >
                                                      <Printer size={16} className="text-orange-600" />
                                                    </button>
                                                  </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2 text-sm">
                                                  <div>
                                                    <span className="text-gray-600">Pago realizado:</span>
                                                    <div className="font-semibold text-orange-600">-{formatLempiras(payment.amount)}</div>
                                                  </div>
                                                  <div>
                                                    <span className="text-gray-600">Interés pendiente:</span>
                                                    <div className="font-semibold text-red-600">{formatLempiras(interestPending)}</div>
                                                  </div>
                                                </div>
                                                <div className="mt-2 text-xs text-gray-500">
                                                  Quincenas: {loanStateAtPayment.quincenas} | Interés acumulado: {formatLempiras(loanStateAtPayment.accruedInterest)}
                                                </div>
                                              </div>
                                            );
                                          })}
                                        
                                        {loan.interestPayments.length === 0 && (
                                          <div className="text-center py-4 text-gray-500 text-sm">
                                            No hay pagos de interés registrados
                                          </div>
                                        )}
                                      </div>
                                      
                                      {/* Interest Summary */}
                                      <div className="mt-4 bg-white rounded-lg p-3 border border-orange-200">
                                        <h6 className="font-semibold text-orange-800 mb-2">Resumen Interés</h6>
                                        <div className="space-y-1 text-sm">
                                          <div className="flex justify-between">
                                            <span>Acumulado:</span>
                                            <span className="font-medium">{formatLempiras(loanState.accruedInterest + loan.interestPayments.reduce((sum, p) => sum + p.amount, 0))}</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span>Total pagado:</span>
                                            <span className="font-medium text-orange-600">
                                              -{formatLempiras(loan.interestPayments.reduce((sum, p) => sum + p.amount, 0))}
                                            </span>
                                          </div>
                                          <div className="flex justify-between border-t pt-1">
                                            <span className="font-semibold">Pendiente:</span>
                                            <span className="font-semibold text-red-600">
                                              {formatLempiras(loanState.accruedInterest)}
                                            </span>
                                          </div>
                                          <div className="flex justify-between text-xs text-gray-500">
                                            <span>Quincenas:</span>
                                            <span>{loanState.quincenas}</span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                {/* Automatic Quincenal History */}
                                <div className="mt-6 pt-4 border-t border-gray-300">
                                  <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                    <Calendar size={18} className="text-purple-600" />
                                    Historial Automático por Quincenas
                                  </h4>
                                  
                                  <QuincenalHistory 
                                    loan={loan} 
                                    clientRate={selectedClient.rate}
                                    formatLempiras={formatLempiras}
                                  />
                                </div>

                                  <div className="space-y-4">
                                    <div>
                                      <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-medium text-gray-700">Pago a Capital</span>
                                        <span className="text-xs text-gray-500">{loan.payments.length} pagos</span>
                                      </div>
                                      <LoanPaymentForm
                                        paymentForm={paymentForm}
                                        setPaymentForm={setPaymentForm}
                                        onAdd={() => addPayment(selectedClient.id, loan.id)}
                                      />
                                    </div>

                                    <div>
                                      <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-medium text-gray-700">Pago de Interés</span>
                                        <span className="text-xs text-gray-500">{loan.interestPayments.length} pagos</span>
                                      </div>
                                      <InterestPaymentForm
                                        interestPaymentForm={interestPaymentForm}
                                        setInterestPaymentForm={setInterestPaymentForm}
                                        onAdd={() => addInterestPayment(selectedClient.id, loan.id)}
                                      />
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                      <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                          💰📊 Pago Combinado (Capital + Interés)
                                        </span>
                                      </div>
                                      <div className="bg-gradient-to-r from-green-50 to-orange-50 p-4 rounded-lg border border-gray-300">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                          <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                              Pago a Capital
                                            </label>
                                            <input
                                              type="number"
                                              min="0"
                                              step="0.01"
                                              value={combinedPaymentForm.capitalAmount}
                                              onChange={e => setCombinedPaymentForm({ ...combinedPaymentForm, capitalAmount: e.target.value })}
                                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                                              placeholder="L 0.00"
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                              Pago de Interés
                                            </label>
                                            <input
                                              type="number"
                                              min="0"
                                              step="0.01"
                                              value={combinedPaymentForm.interestAmount}
                                              onChange={e => setCombinedPaymentForm({ ...combinedPaymentForm, interestAmount: e.target.value })}
                                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                                              placeholder="L 0.00"
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                              Fecha
                                            </label>
                                            <input
                                              type="date"
                                              value={combinedPaymentForm.date}
                                              onChange={e => setCombinedPaymentForm({ ...combinedPaymentForm, date: e.target.value })}
                                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                            />
                                          </div>
                                        </div>
                                        <button
                                          onClick={() => addCombinedPayment(selectedClient.id, loan.id)}
                                          disabled={!combinedPaymentForm.capitalAmount && !combinedPaymentForm.interestAmount}
                                          className="w-full mt-3 bg-gradient-to-r from-green-600 to-orange-600 hover:from-green-700 hover:to-orange-700 disabled:from-gray-400 disabled:to-gray-400 text-white py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2"
                                        >
                                          <DollarSign size={18} />
                                          Agregar Pago Combinado
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Payment History */}
                                {/* Separate Capital and Interest History */}
                                <div className="mt-6 pt-4 border-t border-gray-300">
                                  <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                    <Calendar size={18} className="text-indigo-600" />
                                    Historial Detallado por Categoría
                                  </h4>
                                  
                                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Capital History Column */}
                                    <div className="bg-blue-50 rounded-lg p-4">
                                      <h5 className="text-lg font-semibold text-blue-800 mb-3 flex items-center gap-2">
                                        <DollarSign size={18} />
                                        Historial de Capital
                                      </h5>
                                      
                                      <div className="space-y-3 max-h-80 overflow-y-auto">
                                        {/* Initial loan */}
                                        <div className="bg-white rounded-lg p-3 border border-blue-200">
                                          <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-medium text-gray-700">{loan.date}</span>
                                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                                              Préstamo Inicial
                                            </span>
                                          </div>
                                          <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div>
                                              <span className="text-gray-600">Monto prestado:</span>
                                              <div className="font-semibold text-blue-600">+{formatLempiras(loan.principal)}</div>
                                            </div>
                                            <div>
                                              <span className="text-gray-600">Capital restante:</span>
                                              <div className="font-semibold text-blue-600">{formatLempiras(loan.principal)}</div>
                                            </div>
                                          </div>
                                        </div>

                                        {/* Capital payments */}
                                        {loan.payments
                                          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                                          .map((payment, index) => {
                                            // Calculate capital remaining after this payment
                                            const paymentsUpToThis = loan.payments
                                              .filter(p => new Date(p.date) <= new Date(payment.date))
                                              .reduce((sum, p) => sum + p.amount, 0);
                                            const capitalRemaining = Math.max(0, loan.principal - paymentsUpToThis);
                                            
                                            return (
                                              <div key={payment.id} className="bg-white rounded-lg p-3 border border-green-200">
                                                <div className="flex justify-between items-center mb-2">
                                                  <span className="text-sm font-medium text-gray-700">{payment.date}</span>
                                                  <div className="flex items-center gap-2">
                                                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                                                      Abono a Capital
                                                    </span>
                                                    <button
                                                      onClick={() => {
                                                        const prevState = calcLoanState(loan, selectedClient.rate, new Date(payment.date));
                                                        const prevCap = Math.max(0, loan.principal - loan.payments.filter(p => new Date(p.date) < new Date(payment.date)).reduce((s, p) => s + p.amount, 0));
                                                        const prevInt = prevState.accruedInterest - loan.interestPayments.filter(p => new Date(p.date) < new Date(payment.date)).reduce((s, p) => s + p.amount, 0);
                                                        setReceiptData({
                                                          client: selectedClient,
                                                          loan,
                                                          payments: [{ amount: payment.amount, type: 'capital' }],
                                                          previousCapital: prevCap,
                                                          previousInterest: prevInt,
                                                          currentCapital: Math.max(0, prevCap - payment.amount),
                                                          currentInterest: prevInt
                                                        });
                                                      }}
                                                      className="p-1 hover:bg-green-100 rounded transition-colors"
                                                      title="Ver recibo"
                                                    >
                                                      <Printer size={16} className="text-green-600" />
                                                    </button>
                                                  </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2 text-sm">
                                                  <div>
                                                    <span className="text-gray-600">Abono realizado:</span>
                                                    <div className="font-semibold text-green-600">-{formatLempiras(payment.amount)}</div>
                                                  </div>
                                                  <div>
                                                    <span className="text-gray-600">Capital restante:</span>
                                                    <div className="font-semibold text-blue-600">{formatLempiras(capitalRemaining)}</div>
                                                  </div>
                                                </div>
                                              </div>
                                            );
                                          })}
                                      </div>
                                      
                                      {/* Capital Summary */}
                                      <div className="mt-4 bg-white rounded-lg p-3 border border-blue-200">
                                        <h6 className="font-semibold text-blue-800 mb-2">Resumen Capital</h6>
                                        <div className="space-y-1 text-sm">
                                          <div className="flex justify-between">
                                            <span>Prestado:</span>
                                            <span className="font-medium">{formatLempiras(loan.principal)}</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span>Total pagado:</span>
                                            <span className="font-medium text-green-600">
                                              -{formatLempiras(loan.payments.reduce((sum, p) => sum + p.amount, 0))}
                                            </span>
                                          </div>
                                          <div className="flex justify-between border-t pt-1">
                                            <span className="font-semibold">Restante:</span>
                                            <span className="font-semibold text-blue-600">
                                              {formatLempiras(Math.max(0, loan.principal - loan.payments.reduce((sum, p) => sum + p.amount, 0)))}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

              </>
            )}

          {/* Footer Notes */}
          {currentView === 'clients' && (
          <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
            <h3 className="font-semibold text-gray-800 mb-3">Información del Sistema Avanzado</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Cálculo de Intereses</h4>
                <ul className="space-y-1">
                  <li>• Tasa personalizable por cliente (por defecto 14% quincenal)</li>
                  <li>• Se calcula sobre el capital pendiente al inicio de cada quincena</li>
                  <li>• Los pagos de capital afectan el cálculo para quincenas futuras</li>
                  <li>• Los pagos de interés parciales se acumulan como pendientes</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Funcionalidades Avanzadas</h4>
                <ul className="space-y-1">
                  <li>• Pagos separados: capital e interés</li>
                  <li>• Seguimiento de interés pendiente acumulado</li>
                  <li>• Tasas de interés personalizables por cliente</li>
                  <li>• Historial completo de todos los pagos</li>
                </ul>
              </div>
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  );
}

function QuincenalHistory({
  loan,
  clientRate,
  formatLempiras
}: {
  loan: Loan;
  clientRate: number;
  formatLempiras: (amount: number) => string;
}) {
  const [editingQuincena, setEditingQuincena] = React.useState<number | null>(null);
  const [editForm, setEditForm] = React.useState({
    capitalAtStart: '',
    capitalAtEnd: '',
    interestGenerated: '',
    accumulatedInterest: ''
  });
  function generateQuincenalHistory() {
    const INTEREST_RATE = clientRate / 100;
    const QUINCENAL_MS = 15 * 24 * 60 * 60 * 1000; // 15 days in milliseconds
    const startDate = new Date(loan.date + 'T00:00:00');
    const today = new Date();
    
    const history = [];
    let currentDate = new Date(startDate);
    let quincenaNumber = 0;
    let accumulatedInterest = 0;
    let currentCapital = loan.principal;
    
    // Sort payments by date for processing
    const capitalPayments = [...(loan.payments || [])]
      .map(p => ({ ...p, dateObj: new Date(p.date + 'T00:00:00') }))
      .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
    
    const interestPayments = [...(loan.interestPayments || [])]
      .map(p => ({ ...p, dateObj: new Date(p.date + 'T00:00:00') }))
      .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
    
    // Generate history for each quincenal period
    while (currentDate <= today) {
      const quincenaEndDate = new Date(currentDate.getTime() + QUINCENAL_MS);
      quincenaNumber++;
      
      // Apply capital payments that occurred before or during this quincenal period
      const capitalPaymentsInPeriod = capitalPayments.filter(p => 
        p.dateObj >= currentDate && p.dateObj < quincenaEndDate
      );
      
      const capitalPaidInPeriod = capitalPaymentsInPeriod.reduce((sum, p) => sum + p.amount, 0);
      
      // Calculate interest on capital at the beginning of the period
      const interestForPeriod = currentCapital * INTEREST_RATE;
      accumulatedInterest += interestForPeriod;
      
      // Apply capital payments (affects future interest calculations)
      currentCapital = Math.max(0, currentCapital - capitalPaidInPeriod);
      
      // Apply interest payments that occurred during this period
      const interestPaymentsInPeriod = interestPayments.filter(p => 
        p.dateObj >= currentDate && p.dateObj < quincenaEndDate
      );
      
      const interestPaidInPeriod = interestPaymentsInPeriod.reduce((sum, p) => sum + p.amount, 0);
      accumulatedInterest = Math.max(0, accumulatedInterest - interestPaidInPeriod);
      
      // Calculate total interest paid up to this point
      const totalInterestPaidUpToNow = interestPayments
        .filter(p => p.dateObj < quincenaEndDate)
        .reduce((sum, p) => sum + p.amount, 0);
      
      history.push({
        quincenaNumber,
        startDate: new Date(currentDate),
        endDate: new Date(quincenaEndDate.getTime() - 1), // End of period
        capitalAtStart: currentCapital + capitalPaidInPeriod, // Capital before payments
        capitalAtEnd: currentCapital,
        interestGenerated: interestForPeriod,
        accumulatedInterest,
        capitalPayments: capitalPaymentsInPeriod,
        interestPayments: interestPaymentsInPeriod,
        capitalPaidInPeriod,
        interestPaidInPeriod,
        totalInterestPaidUpToNow,
        isPastPeriod: quincenaEndDate <= today
      });
      
      // Move to next quincenal period
      currentDate = new Date(quincenaEndDate);
      
      // Stop if we've covered enough future periods or capital is fully paid
      if (currentCapital === 0 && accumulatedInterest === 0) break;
      if (currentDate.getTime() > today.getTime() + (QUINCENAL_MS * 2)) break; // Show 2 future periods max
    }
    
    return history;
  }
  
  const quincenalHistory = generateQuincenalHistory();
  
  return (
    <div className="bg-purple-50 rounded-lg p-4">
      <div className="mb-4">
        <h5 className="text-lg font-semibold text-purple-800 mb-2">
          Evolución Automática por Quincenas
        </h5>
        <p className="text-sm text-purple-700">
          Sistema inteligente que calcula automáticamente el interés cada 15 días desde la fecha del préstamo
        </p>
      </div>
      
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {quincenalHistory.map((period) => (
          <div 
            key={period.quincenaNumber} 
            className={`rounded-lg p-4 border-2 ${
              period.isPastPeriod 
                ? 'bg-white border-purple-200' 
                : 'bg-yellow-50 border-yellow-300'
            }`}
          >
            <div className="flex justify-between items-center mb-3">
              <div>
                <h6 className="font-semibold text-gray-800">
                  Quincena #{period.quincenaNumber}
                </h6>
                <p className="text-sm text-gray-600">
                  {period.startDate.toLocaleDateString('es-HN')} - {period.endDate.toLocaleDateString('es-HN')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {period.isPastPeriod ? (
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                    Completada
                  </span>
                ) : (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                    Proyección
                  </span>
                )}
                {editingQuincena !== period.quincenaNumber && (
                  <button
                    onClick={() => {
                      setEditingQuincena(period.quincenaNumber);
                      setEditForm({
                        capitalAtStart: period.capitalAtStart.toString(),
                        capitalAtEnd: period.capitalAtEnd.toString(),
                        interestGenerated: period.interestGenerated.toString(),
                        accumulatedInterest: period.accumulatedInterest.toString()
                      });
                    }}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Editar valores de esta quincena"
                  >
                    <Edit2 size={14} />
                  </button>
                )}
              </div>
            </div>
            
            {editingQuincena === period.quincenaNumber ? (
              <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 mb-3">
                <h7 className="font-semibold text-blue-800 mb-3 block flex items-center gap-2">
                  <Edit2 size={16} />
                  Editando Quincena #{period.quincenaNumber}
                </h7>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Capital al inicio (L)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editForm.capitalAtStart}
                      onChange={(e) => setEditForm({ ...editForm, capitalAtStart: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Capital al final (L)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editForm.capitalAtEnd}
                      onChange={(e) => setEditForm({ ...editForm, capitalAtEnd: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Interés generado (L)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editForm.interestGenerated}
                      onChange={(e) => setEditForm({ ...editForm, interestGenerated: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Interés acumulado (L)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editForm.accumulatedInterest}
                      onChange={(e) => setEditForm({ ...editForm, accumulatedInterest: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      alert('Guardar cambios en la quincena (funcionalidad pendiente de implementar en base de datos)');
                      setEditingQuincena(null);
                    }}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
                  >
                    Guardar Cambios
                  </button>
                  <button
                    onClick={() => setEditingQuincena(null)}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-lg text-sm font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
                <div className="mt-3 text-xs text-blue-700 bg-blue-100 p-2 rounded">
                  <strong>Nota:</strong> Esta edición es solo visual. Para guardar cambios permanentes se necesita implementar la persistencia en base de datos.
                </div>
              </div>
            ) : null}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              {/* Capital Column */}
              <div className="bg-blue-50 rounded-lg p-3">
                <h7 className="font-semibold text-blue-800 mb-2 block">Capital</h7>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Al inicio:</span>
                    <span className="font-medium">{formatLempiras(period.capitalAtStart)}</span>
                  </div>
                  {period.capitalPaidInPeriod > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Pagado:</span>
                      <span className="font-medium text-green-600">-{formatLempiras(period.capitalPaidInPeriod)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t pt-1">
                    <span className="font-semibold">Al final:</span>
                    <span className="font-semibold text-blue-600">{formatLempiras(period.capitalAtEnd)}</span>
                  </div>
                </div>
              </div>

              {/* Interest Column */}
              <div className="bg-orange-50 rounded-lg p-3">
                <h7 className="font-semibold text-orange-800 mb-2 block">Interés</h7>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Generado:</span>
                    <span className="font-medium text-orange-600">+{formatLempiras(period.interestGenerated)}</span>
                  </div>
                  {period.interestPaidInPeriod > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Pagado:</span>
                      <span className="font-medium text-green-600">-{formatLempiras(period.interestPaidInPeriod)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t pt-1">
                    <span className="font-semibold">Acumulado:</span>
                    <span className="font-semibold text-red-600">{formatLempiras(period.accumulatedInterest)}</span>
                  </div>
                </div>
              </div>

              {/* Summary Column */}
              <div className="bg-gray-50 rounded-lg p-3">
                <h7 className="font-semibold text-gray-800 mb-2 block">Resumen</h7>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tasa:</span>
                    <span className="font-medium">{clientRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Días:</span>
                    <span className="font-medium">15</span>
                  </div>
                  <div className="flex justify-between border-t pt-1">
                    <span className="font-semibold">Total debe:</span>
                    <span className="font-semibold text-purple-600">
                      {formatLempiras(period.capitalAtEnd + period.accumulatedInterest)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Payments in this period */}
            {(period.capitalPayments.length > 0 || period.interestPayments.length > 0) && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <h7 className="font-semibold text-gray-800 mb-2 block">Pagos en este período:</h7>
                <div className="flex flex-wrap gap-2">
                  {period.capitalPayments.map((payment) => (
                    <span key={payment.id} className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                      Capital: {formatLempiras(payment.amount)} ({payment.date})
                    </span>
                  ))}
                  {period.interestPayments.map((payment) => (
                    <span key={payment.id} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                      Interés: {formatLempiras(payment.amount)} ({payment.date})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Summary */}
      <div className="mt-4 bg-white rounded-lg p-4 border-2 border-purple-200">
        <h6 className="font-semibold text-purple-800 mb-2">Resumen del Sistema Inteligente</h6>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Total quincenas:</span>
            <div className="font-semibold">{quincenalHistory.filter(p => p.isPastPeriod).length} completadas</div>
          </div>
          <div>
            <span className="text-gray-600">Interés total generado:</span>
            <div className="font-semibold text-orange-600">
              {formatLempiras(quincenalHistory.reduce((sum, p) => sum + p.interestGenerated, 0))}
            </div>
          </div>
          <div>
            <span className="text-gray-600">Estado actual:</span>
            <div className="font-semibold text-purple-600">
              {formatLempiras(
                quincenalHistory[quincenalHistory.length - 1]?.capitalAtEnd + 
                quincenalHistory[quincenalHistory.length - 1]?.accumulatedInterest || 0
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoanPaymentForm({
  paymentForm,
  setPaymentForm,
  onAdd
}: {
  paymentForm: { amount: string; date: string };
  setPaymentForm: (form: { amount: string; date: string }) => void;
  onAdd: () => void;
}) {
  return (
    <div className="space-y-2">
      <div>
        <input
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors text-sm"
          placeholder="L 0.00"
          value={paymentForm.amount}
          onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
        />
      </div>
      <div>
        <input
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors text-sm"
          type="date"
          value={paymentForm.date}
          onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })}
        />
      </div>
      <button
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
        onClick={onAdd}
      >
        <Plus size={16} />
        Pago Capital
      </button>
    </div>
  );
}

function InterestPaymentForm({
  interestPaymentForm,
  setInterestPaymentForm,
  onAdd
}: {
  interestPaymentForm: { amount: string; date: string };
  setInterestPaymentForm: (form: { amount: string; date: string }) => void;
  onAdd: () => void;
}) {
  return (
    <div className="space-y-2">
      <div>
        <input
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
          placeholder="L 0.00 (interés)"
          value={interestPaymentForm.amount}
          onChange={(e) => setInterestPaymentForm({ ...interestPaymentForm, amount: e.target.value })}
        />
      </div>
      <div>
        <input
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
          type="date"
          value={interestPaymentForm.date}
          onChange={(e) => setInterestPaymentForm({ ...interestPaymentForm, date: e.target.value })}
        />
      </div>
      <button
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
        onClick={onAdd}
      >
        <Plus size={16} />
        Pago Interés
      </button>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/accept-invite/:code" element={<AcceptInvitePage />} />
      <Route path="/*" element={<MainApp />} />
    </Routes>
  );
}