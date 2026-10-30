# Directrices del Sistema: Inventario QR - Camisería Europea

## CONTEXTO DEL PROYECTO
Este es el código fuente del proyecto "APP-INV-QR-CE-01", un sistema de trazabilidad de inventario textil y soporte a la toma de decisiones para Camisería Europea. Utiliza el Stack PERN (PostgreSQL, Express, React, Node.js).

## ARQUITECTURA DE SOFTWARE
El proyecto sigue un patrón estricto de Arquitectura Cliente-Servidor por Capas (Controlador-Servicio-Repositorio):

1. **Capa de Presentación:** Construida en React (SPA). Separada lógicamente por roles y flujos. Utiliza `recharts` para dashboards estadísticos y generación de reportes PDF.
2. **Capa de API/Controladores:** Express.js gestiona las rutas RESTful, validación de peticiones y Middlewares de Autenticación JWT.
3. **Capa de Lógica de Negocio (Servicios):** Node.js ejecuta los cálculos de saldos, genera Códigos QR (`qrcode`), valida colores de tela mediante diccionarios estrictos, y gestiona el envío de correos automatizados (`nodemailer`) para aprobaciones y alertas.
4. **Capa de Acceso a Datos (Repositorios):** PostgreSQL mediante el driver `pg`. Obligatorio el uso de consultas parametrizadas y aislamiento estricto de la lógica SQL.

## ESTRUCTURA DE BASE DE DATOS REQUERIDA (POSTGRESQL)
El sistema se sostiene sobre 3 entidades principales con integridad referencial:

- **usuarios:** (id, nombre, email, password_hash, rol, estado, aprobacion_token, fecha_creacion). 
  *(Nota: 'estado' maneja 'pendiente_aprobacion' y 'activo').*
- **rollos:** (id, codigo_sku, tipo_tela, color, metraje_inicial, metraje_actual, stock_minimo, alerta_enviada, fecha_ingreso).
- **cortes:** (id, rollo_id [FK], usuario_id [FK], metros_cortados, fecha_corte).

## REGLAS DE NEGOCIO ESTRICTAS

**1. Control de Acceso y Aprobación Dual (RBAC):**
- **gerencia:** Acceso a gestión de usuarios, ingreso de rollos, dashboards y reportes.
- **operario:** Acceso restringido. Únicamente puede escanear códigos QR y reportar cortes de tela.
- **Aprobación Dual (Seguridad):** Ningún usuario puede auto-registrarse. La gerencia crea las cuentas, pero nacen en estado `pendiente_aprobacion`. El acceso solo se habilita cuando el Súper Administrador aprueba el ingreso mediante un enlace enviado por SMTP (Gmail).

**2. Consistencia de Inventario y Transacciones ACID:**
- Un corte JAMÁS puede ser procesado si la cantidad a descontar es superior al `metraje_actual` del rollo.
- El proceso de "Descontar tela" (restar en `rollos` e insertar en `cortes`) y la evaluación de alertas de stock, DEBE ejecutarse dentro de una única transacción SQL (`BEGIN`, `COMMIT`, `ROLLBACK`).

**3. Soporte a Decisiones (DSS) y Alertas Automáticas:**
- **Alertas de Stock:** Si al descontar tela el `metraje_actual` cae por debajo o igual al `stock_minimo`, se debe disparar un correo SMTP de alerta al gerente de forma automática y cambiar el flag `alerta_enviada` a `true`.
- **Filtros Acumulativos:** Las búsquedas de inventario deben permitir el cruce de texto libre, colores y tipos de tela de forma simultánea.

**4. Validación de Calidad de Datos:**
- El sistema debe bloquear cualquier intento de registrar un nuevo rollo cuyo "color" no pertenezca a un catálogo/diccionario de colores textiles válidos parametrizado en el backend, o que contenga caracteres especiales/números.