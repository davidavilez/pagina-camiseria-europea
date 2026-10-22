Directrices del Sistema: Inventario QR - Camisería Europea

CONTEXTO DEL PROYECTO
Este es el código fuente del proyecto "APP-INV-QR-CE-01", un sistema de trazabilidad de inventario textil para Camisería Europea. Utiliza el Stack PERN (PostgreSQL, Express, React, Node.js).

ARQUITECTURA DE SOFTWARE
El proyecto sigue un patrón de Arquitectura Cliente-Servidor por Capas:

Capa de Presentación: Construida en React (SPA). Separada lógicamente por roles (Componentes Gerencia.jsx y Operario.jsx).

Capa de API/Controladores: Express.js gestiona las rutas RESTful, recibe JSON y valida peticiones (Middlewares de Autenticación).

Capa de Lógica de Negocio: Servicios de Node.js donde se calculan los saldos, se valida el stock y se generan los Códigos QR usando la librería qrcode.

Capa de Acceso a Datos (Persistencia): PostgreSQL mediante el driver pg. Obligatorio el uso de consultas parametrizadas para evitar SQL Injection.

ESTRUCTURA DE BASE DE DATOS REQUERIDA (POSTGRESQL)
El sistema se sostiene sobre 3 entidades con integridad referencial:

usuarios (id, nombre, email, password_hash, rol, estado, fecha_creacion).

rollos (id, codigo_sku, tipo_tela, color, metraje_inicial, metraje_actual, fecha_ingreso).

cortes (id, rollo_id [FK], operario_id [FK], metros_cortados, fecha_corte).

REGLAS DE NEGOCIO ESTRICTAS

Control de Acceso Basado en Roles (RBAC):

gerencia: Acceso total. Gestión de usuarios, ingreso de rollos, visión de reportes y auditoría.

operario: Acceso restringido. Únicamente puede escanear códigos QR y reportar cortes de tela.

Regla de creación: Ningún usuario puede auto-registrarse. Solo los perfiles de gerencia pueden crear nuevas cuentas.

Consistencia de Inventario:

Un corte JAMÁS puede ser procesado si la cantidad a descontar es superior al metraje_actual del rollo. El sistema debe lanzar un error descriptivo.