import React from "react";
import BiometricAuth from "./BiometricAuth";

export default function SeguridadYPoliticas() {
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-2xl shadow-md">
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">Seguridad, Privacidad y Mantenimiento</h1>
        <p className="mt-2 text-sm text-gray-600">Políticas y procedimientos del sistema de gestión de préstamos</p>
      </header>

      <BiometricAuth />

      <section className="space-y-6">
        <article className="p-4 border border-gray-200 rounded-xl bg-gradient-to-br from-white to-blue-50">
          <h2 className="text-lg font-semibold text-blue-900">1. Seguridad del Sistema</h2>
          <p className="text-sm text-gray-600 mt-2">Medidas implementadas para proteger tu información y operaciones.</p>

          <ul className="mt-3 space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold mt-0.5">•</span>
              <span><strong>Autenticación segura:</strong> Sistema de registro con email y contraseña encriptada. Cada sesión es única y protegida.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold mt-0.5">•</span>
              <span><strong>Aislamiento de datos:</strong> Tus clientes y préstamos son visibles solo para ti. Ningún otro usuario puede acceder a tu información.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold mt-0.5">•</span>
              <span><strong>Cifrado de datos:</strong> Toda la información se transmite mediante HTTPS/TLS y se almacena de forma segura en Supabase.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold mt-0.5">•</span>
              <span><strong>Gestión de sesiones:</strong> Las sesiones se invalidan al cerrar sesión y expiran automáticamente por inactividad.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold mt-0.5">•</span>
              <span><strong>Protección contra ataques:</strong> El sistema incluye validación de entradas, protección XSS y CSRF integradas.</span>
            </li>
          </ul>
        </article>

        <article className="p-4 border border-gray-200 rounded-xl bg-gradient-to-br from-white to-green-50">
          <h2 className="text-lg font-semibold text-green-900">2. Privacidad de Datos</h2>
          <p className="text-sm text-gray-600 mt-2">Cómo protegemos la información personal y financiera de tus clientes.</p>

          <ul className="mt-3 space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold mt-0.5">•</span>
              <span><strong>Datos mínimos necesarios:</strong> Solo almacenamos nombre, identificación (opcional), apodo (opcional), tasa de interés y datos de préstamos.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold mt-0.5">•</span>
              <span><strong>Control total:</strong> Puedes modificar o eliminar cualquier cliente y sus datos en cualquier momento.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold mt-0.5">•</span>
              <span><strong>Sin compartir datos:</strong> Tu información nunca se comparte con terceros. Solo tú tienes acceso a tus registros.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold mt-0.5">•</span>
              <span><strong>Backups automáticos:</strong> Supabase realiza respaldos automáticos de tu información para prevenir pérdida de datos.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold mt-0.5">•</span>
              <span><strong>Retención de datos:</strong> Los datos se mantienen mientras tu cuenta esté activa. Puedes solicitar eliminación completa en cualquier momento.</span>
            </li>
          </ul>
        </article>

        <article className="p-4 border border-gray-200 rounded-xl bg-gradient-to-br from-white to-purple-50">
          <h2 className="text-lg font-semibold text-purple-900">3. Funcionalidad del Sistema</h2>
          <p className="text-sm text-gray-600 mt-2">Capacidades y límites del sistema de gestión de préstamos.</p>

          <ul className="mt-3 space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-purple-600 font-bold mt-0.5">•</span>
              <span><strong>Gestión de clientes:</strong> Registra múltiples clientes con sus datos personales y tasas de interés personalizadas.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 font-bold mt-0.5">•</span>
              <span><strong>Múltiples préstamos:</strong> Cada cliente puede tener varios préstamos activos simultáneamente con seguimiento independiente.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 font-bold mt-0.5">•</span>
              <span><strong>Control de pagos:</strong> Registra pagos de capital e intereses por separado con cálculo automático de saldos.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 font-bold mt-0.5">•</span>
              <span><strong>Cálculo automático:</strong> El sistema calcula intereses acumulados, saldos pendientes y quincenas transcurridas automáticamente.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 font-bold mt-0.5">•</span>
              <span><strong>Búsqueda y filtros:</strong> Encuentra clientes rápidamente por nombre, apodo o número de identificación.</span>
            </li>
          </ul>
        </article>

        <article className="p-4 border border-gray-200 rounded-xl bg-gradient-to-br from-white to-orange-50">
          <h2 className="text-lg font-semibold text-orange-900">4. Recomendaciones de Uso</h2>
          <p className="text-sm text-gray-600 mt-2">Mejores prácticas para usar el sistema de forma efectiva y segura.</p>

          <ul className="mt-3 space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-orange-600 font-bold mt-0.5">•</span>
              <span><strong>Contraseña segura:</strong> Usa una contraseña fuerte y única. No la compartas con nadie.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-600 font-bold mt-0.5">•</span>
              <span><strong>Cierra sesión:</strong> Siempre cierra sesión al terminar, especialmente en computadoras compartidas.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-600 font-bold mt-0.5">•</span>
              <span><strong>Verifica los datos:</strong> Revisa cuidadosamente montos y fechas antes de registrar préstamos o pagos.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-600 font-bold mt-0.5">•</span>
              <span><strong>Registra pagos puntualmente:</strong> Mantén el sistema actualizado para cálculos precisos de intereses.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-600 font-bold mt-0.5">•</span>
              <span><strong>Respaldos adicionales:</strong> Aunque el sistema hace respaldos automáticos, considera exportar reportes periódicamente.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-600 font-bold mt-0.5">•</span>
              <span><strong>Datos opcionales:</strong> Los campos de identificación y apodo son opcionales. Úsalos según tu necesidad.</span>
            </li>
          </ul>
        </article>

        <article className="p-4 border border-gray-200 rounded-xl bg-gradient-to-br from-white to-red-50">
          <h2 className="text-lg font-semibold text-red-900">5. Responsabilidades del Usuario</h2>
          <p className="text-sm text-gray-600 mt-2">Tu compromiso al usar este sistema.</p>

          <ul className="mt-3 space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-red-600 font-bold mt-0.5">•</span>
              <span><strong>Legalidad:</strong> Usa el sistema únicamente para operaciones legales y autorizadas de préstamos.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-600 font-bold mt-0.5">•</span>
              <span><strong>Exactitud de datos:</strong> Eres responsable de la veracidad y exactitud de la información ingresada.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-600 font-bold mt-0.5">•</span>
              <span><strong>Cumplimiento normativo:</strong> Asegúrate de cumplir con las leyes locales sobre préstamos y tasas de interés.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-600 font-bold mt-0.5">•</span>
              <span><strong>Privacidad de clientes:</strong> Protege la información de tus clientes y úsala solo para fines autorizados.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-600 font-bold mt-0.5">•</span>
              <span><strong>Acceso no autorizado:</strong> No compartas tu cuenta ni permitas que otros accedan con tus credenciales.</span>
            </li>
          </ul>
        </article>

        <article className="p-4 border border-gray-200 rounded-xl bg-gradient-to-br from-white to-slate-50">
          <h2 className="text-lg font-semibold text-slate-900">6. Soporte y Mantenimiento</h2>
          <p className="text-sm text-gray-600 mt-2">Información sobre actualizaciones y asistencia técnica.</p>

          <ul className="mt-3 space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-slate-600 font-bold mt-0.5">•</span>
              <span><strong>Disponibilidad:</strong> El sistema está disponible 24/7 a través de cualquier navegador web moderno.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-slate-600 font-bold mt-0.5">•</span>
              <span><strong>Actualizaciones:</strong> Las mejoras se implementan automáticamente sin interrumpir tu acceso.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-slate-600 font-bold mt-0.5">•</span>
              <span><strong>Infraestructura:</strong> Sistema hospedado en Bolt.new con base de datos segura en Supabase.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-slate-600 font-bold mt-0.5">•</span>
              <span><strong>Compatibilidad:</strong> Funciona en Chrome, Firefox, Safari, Edge y navegadores móviles modernos.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-slate-600 font-bold mt-0.5">•</span>
              <span><strong>Mantenimiento:</strong> Respaldos automáticos diarios y monitoreo continuo de seguridad.</span>
            </li>
          </ul>
        </article>

        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-xl border border-gray-200">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-lg">ℹ️</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Información Adicional</h3>
              <p className="text-sm text-gray-700 mt-1">
                Este sistema ha sido diseñado específicamente para la gestión de préstamos personales con cálculo automático de intereses.
                Mantén tus datos actualizados para obtener reportes precisos y tomar mejores decisiones financieras.
              </p>
              <p className="text-xs text-gray-600 mt-2">
                Si tienes dudas sobre el funcionamiento o necesitas ayuda, revisa las secciones anteriores o contacta con el administrador del sistema.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="mt-8 pt-4 border-t border-gray-200 text-center">
        <p className="text-xs text-gray-500">Sistema de Gestión de Préstamos</p>
        <p className="text-xs text-gray-400 mt-1">Última actualización: 22 de octubre de 2025</p>
      </footer>
    </div>
  );
}
