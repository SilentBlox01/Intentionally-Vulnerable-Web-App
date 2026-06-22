# Guía de Despliegue y Configuración Local (DEPLOY.md)

Esta guía explica detalladamente cómo configurar, ejecutar y desplegar la aplicación web en tu máquina local o en diferentes entornos.

---

## 1. Despliegue Local (Máquina Física)

La forma más directa de probar la aplicación es ejecutándola directamente con Node.js en tu computadora.

### Requisitos Previos
- **Node.js**: Versión 16.x o superior. (Recomendado 18.x)
- **Git**: Para clonar el repositorio.

### Pasos de Instalación

1. **Clonar el repositorio**:
   ```bash
   git clone https://github.com/TU_USUARIO/TU_REPOSITORIO.git
   cd "SecureTrust Bank"
   ```

2. **Instalar dependencias**:
   Esto instalará todas las librerías necesarias (`express`, `sqlite3`, etc.) listadas en el `package.json`.
   ```bash
   npm install
   ```

3. **Configurar Variables de Entorno y Configuración**:
   Renombra los archivos de ejemplo para que la aplicación los pueda leer:
   ```bash
   cp .env.example .env
   cp config.js.example config.js
   ```
   **Nota de seguridad intencional:** En este proyecto las credenciales falsas vienen incluidas a propósito en los archivos de ejemplo. La aplicación leerá los valores de estos archivos automáticamente. No necesitas configurar nada adicional a menos que desees cambiar los puertos o las contraseñas falsas.

4. **Ejecutar la aplicación**:
   ```bash
   npm start
   ```
   *Alternativa: `node server.js`*

5. **Acceder a la web**:
   Abre tu navegador y ve a: **[http://localhost:3000](http://localhost:3000)**. 
   La base de datos SQLite se inicializará automáticamente si no existe.

---

## 2. Despliegue usando Docker

Si no quieres instalar Node.js en tu máquina, o prefieres mantener la aplicación aislada, puedes usar Docker. El proyecto ya incluye un `Dockerfile` configurado.

### Requisitos
- **Docker Desktop** o el motor de Docker instalado y ejecutándose.

### Pasos

1. **Construir la imagen de Docker**:
   Ejecuta esto en la raíz del proyecto para crear la imagen.
   ```bash
   docker build -t securetrust-bank .
   ```

2. **Correr el contenedor**:
   Esto iniciará el contenedor y mapeará el puerto 3000 de tu máquina al puerto 3000 del contenedor.
   ```bash
   docker run -p 3000:3000 securetrust-bank
   ```

3. **Acceso**:
   Ve a **[http://localhost:3000](http://localhost:3000)** en tu navegador.

---

## 3. Despliegue Rápido en Replit (En la nube)

El proyecto está preparado para funcionar directamente en Replit sin configuración adicional gracias a los archivos `.replit` y `replit.nix`.

1. Sube el proyecto a tu cuenta de GitHub.
2. Inicia sesión en [Replit](https://replit.com/).
3. Haz clic en el botón de **"Import from GitHub"**.
4. Pega la URL de tu repositorio.
5. Replit leerá los archivos de configuración, instalará Node.js 18, ejecutará `npm install` automáticamente y levantará el servidor web.

---

## Solución de Problemas Comunes

- **Error: `EADDRINUSE: address already in use :::3000`**
  Esto significa que ya tienes otra aplicación corriendo en el puerto 3000. Cierra ese proceso o cambia el puerto en tu `.env` o en el archivo `server.js`.

- **Error: `better-sqlite3` falló al compilar**
  En algunos sistemas (especialmente Windows) si no tienes las herramientas de compilación de C++, `better-sqlite3` puede fallar. Asegúrate de tener Python y las herramientas de compilación instaladas, o usa la versión de Docker que ya incluye un entorno preparado.

- **Faltan datos de prueba**
  La base de datos se reinicia automáticamente si se borra la carpeta `database/bank.db`. Si la aplicación arranca pero no puedes iniciar sesión, simplemente reinicia el servidor; el archivo `database/init.js` se asegurará de crear a los usuarios de prueba (`admin`, `carlos`, etc.).
