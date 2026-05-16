# 📚 GUÍA DE COMANDOS - Grupo Psi Platform

> Documento de aprendizaje: todos los comandos usados, para qué sirven, errores encontrados y cómo se corrigieron.

---

## 🖥️ SERVIDOR VPS

### Datos del servidor
```
IP:       147.93.138.51
Usuario:  dani
Sistema:  Ubuntu/Debian
Nginx:    Reverse proxy (puerto 80/443)
PM2:      Gestor de procesos Node.js
```

---

## 📁 ESTRUCTURA DEL PROYECTO

```
~/grupo-psi-platform/    ← Carpeta del proyecto (¡NO /var/www/grupopsi!)
  src/                   ← Código fuente React
  dist/                  ← Build de producción (generado con npm run build)
  .github/workflows/     ← GitHub Actions (eliminado, no funcionó)
  public/
  supabase/
```

---

## 🔑 COMANDOS SSH

### Conectarse al VPS
```bash
ssh dani@147.93.138.51
```
**Para qué sirve:** Abre una sesión remota en el servidor. Necesitas tener tu clave SSH pública en `~/.ssh/authorized_keys` del VPS.

### Ver claves SSH existentes
```bash
ls -la ~/.ssh/
```
**Para qué sirve:** Lista todos los archivos de claves SSH. Los archivos sin `.pub` son claves privadas (secretas), los `.pub` son públicos (se comparten).

### Generar un nuevo par de claves SSH
```bash
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_actions -N ""
```
**Para qué sirve:** Crea dos archivos:
- `github_actions` → clave privada (va en GitHub Secrets)
- `github_actions.pub` → clave pública (va en `authorized_keys` del VPS)

**`-t ed25519`** = algoritmo moderno y seguro  
**`-C`** = comentario identificador  
**`-f`** = nombre del archivo  
**`-N ""`** = sin contraseña (necesario para automatización)

### Autorizar una clave pública en el VPS
```bash
cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```
**Para qué sirve:** Agrega la clave pública a la lista de claves autorizadas para entrar al servidor. El `chmod 600` es obligatorio — si los permisos son incorrectos, SSH ignora el archivo por seguridad.

### Copiar clave pública al portapapeles (Mac)
```bash
cat ~/.ssh/id_ed25519 | pbcopy
```
**Para qué sirve:** Copia el contenido de la clave privada al portapapeles de macOS para pegarlo en GitHub Secrets.

---

## ⚙️ CONFIGURACIÓN SSH DEL SERVIDOR

### Ver configuración SSH
```bash
grep -E "PubkeyAuth|AuthorizedKeys|PasswordAuth|PermitRoot" /etc/ssh/sshd_config
```
**Para qué sirve:** Muestra las opciones de autenticación activas en el servidor SSH.

### Habilitar autenticación por clave pública
```bash
sudo sed -i 's/PubkeyAuthentication no/PubkeyAuthentication yes/' /etc/ssh/sshd_config
sudo systemctl restart ssh
```
**Para qué sirve:** Cambia `PubkeyAuthentication no` a `yes` en el archivo de configuración SSH y reinicia el servicio para aplicar el cambio.

**⚠️ IMPORTANTE:** En Ubuntu/Debian el servicio se llama `ssh`, NO `sshd`. Usar `systemctl restart sshd` da error.

### Verificar configuración activa (sin reiniciar)
```bash
sudo sshd -T | grep pubkeyauthentication
```
**Para qué sirve:** Muestra la configuración que SSH está usando en tiempo real. Más confiable que leer el archivo porque muestra los valores por defecto también.

---

## 🔥 FIREWALL (UFW)

### Ver estado del firewall
```bash
sudo ufw status
```
**Para qué sirve:** Lista todas las reglas activas. `ALLOW Anywhere` significa que cualquier IP puede conectarse a ese puerto.

### Ver reglas de iptables
```bash
sudo iptables -L INPUT -n | head -20
```
**Para qué sirve:** Muestra las reglas de firewall a nivel más bajo. `policy DROP` significa que todo lo que no esté explícitamente permitido se bloquea.

---

## 📦 DEPLOY MANUAL

### Deploy completo desde el VPS
```bash
cd ~/grupo-psi-platform && \
git pull origin main && \
/usr/bin/npm install && \
/usr/bin/npm run build && \
/usr/local/bin/pm2 restart grupo-psi 2>/dev/null || /usr/local/bin/pm2 start /usr/bin/npm --name grupo-psi -- start && \
echo "=== Deploy completado ==="
```
**Para qué sirve:** Actualiza el código desde GitHub, instala dependencias, genera el build de producción y reinicia el proceso en PM2.

**Rutas absolutas importantes:**
- `node` → `/usr/bin/node` (v20.20.2)
- `npm`  → `/usr/bin/npm`
- `pm2`  → `/usr/local/bin/pm2`

**¿Por qué rutas absolutas?** Cuando SSH ejecuta comandos remotamente, no carga el PATH completo del usuario. Si usas solo `npm` puede dar `command not found`.

### Verificar dónde están los binarios
```bash
which node && which npm && which pm2 && node --version
```
**Para qué sirve:** Muestra la ruta exacta de cada comando. Esencial antes de configurar scripts automáticos.

---

## 🔄 GIT

### Ver remote actual
```bash
git remote -v
```
**Para qué sirve:** Muestra la URL del repositorio remoto. Puede ser SSH (`git@github.com:...`) o HTTPS (`https://github.com/...`).

### Cambiar remote de SSH a HTTPS
```bash
git remote set-url origin https://github.com/Danielpriego1/grupo-psi-platform.git
```
**Para qué sirve:** Cambia la URL del remote. HTTPS usa usuario/contraseña (o token), SSH usa claves. En el VPS conviene HTTPS si no hay clave SSH de GitHub configurada.

### Pull y push básicos
```bash
git pull origin main   # Bajar cambios de GitHub al VPS
git push origin main   # Subir cambios del VPS a GitHub
```

---

## 🟢 PM2 (Gestor de procesos)

### Ver procesos activos
```bash
/usr/local/bin/pm2 list
```

### Reiniciar proceso
```bash
/usr/local/bin/pm2 restart grupo-psi
```

### Iniciar proceso nuevo
```bash
/usr/local/bin/pm2 start /usr/bin/npm --name grupo-psi -- start
```

### Ver logs en tiempo real
```bash
/usr/local/bin/pm2 logs grupo-psi
```
**Para qué sirve:** PM2 mantiene la app corriendo en segundo plano y la reinicia automáticamente si falla.

---

## 🌐 NGINX

### Verificar configuración (sin reiniciar)
```bash
sudo nginx -t
```
**Para qué sirve:** Valida que el archivo de configuración de Nginx no tenga errores de sintaxis. SIEMPRE hacer esto antes de recargar.

### Recargar Nginx (sin cortar conexiones)
```bash
sudo systemctl reload nginx
```

---

## ❌ ERRORES ENCONTRADOS Y SOLUCIONES

### Error 1: `sshd.service not found`
```
Failed to reload sshd.service: Unit sshd.service not found.
```
**Causa:** En Ubuntu/Debian el servicio SSH se llama `ssh`, no `sshd` (sshd es en CentOS/RHEL).  
**Solución:**
```bash
sudo systemctl restart ssh   # ← correcto en Ubuntu
```

---

### Error 2: `ssh: no key found`
```
ssh.ParsePrivateKey: ssh: no key found
```
**Causa:** El secret `DEPLOY_SSH_KEY` en GitHub Actions contenía la clave **pública** (`ssh-ed25519 AAAA...`) en lugar de la clave **privada** (`-----BEGIN OPENSSH PRIVATE KEY-----`).  
**Diferencia clave:**
- Clave PRIVADA: archivo `id_ed25519` (sin extensión) → va en GitHub Secrets
- Clave PÚBLICA: archivo `id_ed25519.pub` → va en `authorized_keys` del servidor

**Solución:** Usar la clave privada correcta.

---

### Error 3: `attempted methods [none publickey], no supported methods remain`
```
ssh: handshake failed: ssh: unable to authenticate, attempted methods [none publickey]
```
**Causa:** `PubkeyAuthentication` estaba desactivado en `/etc/ssh/sshd_config` (`PubkeyAuthentication no`). El servidor rechazaba cualquier intento de autenticación con clave.  
**Solución:**
```bash
sudo sed -i 's/PubkeyAuthentication no/PubkeyAuthentication yes/' /etc/ssh/sshd_config
sudo systemctl restart ssh
sudo sshd -T | grep pubkeyauthentication  # Verificar que quedó en 'yes'
```

---

### Error 4: `command not found: nvm` en SSH remoto
**Causa:** NVM (Node Version Manager) se carga en el `.bashrc` del usuario, pero SSH no ejecuta shells interactivos cuando corre scripts remotamente, así que NVM no está disponible.  
**Solución:** Usar rutas absolutas en vez de depender del PATH:
```bash
/usr/bin/npm install    # en vez de: npm install
/usr/local/bin/pm2 ...  # en vez de: pm2 ...
```

---

### Error 5: `git@github.com: Permission denied (publickey)`
**Causa:** El VPS intentó conectarse a GitHub via SSH pero no tiene ninguna clave SSH autorizada en la cuenta de GitHub.  
**Solución:** Cambiar el remote a HTTPS:
```bash
git remote set-url origin https://github.com/Danielpriego1/grupo-psi-platform.git
```
O agregar la clave pública del VPS como Deploy Key en GitHub (Settings → Deploy keys).

---

### Error 6: Carpeta equivocada
**Causa:** Se usó `/var/www/grupopsi` como carpeta de trabajo pero el proyecto real está en `~/grupo-psi-platform`.  
**Lección:** Siempre verificar la ruta con `pwd` antes de ejecutar comandos destructivos.
```bash
pwd   # Muestra en qué carpeta estás actualmente
ls    # Lista los archivos para confirmar que es la carpeta correcta
```

---

### Error 7: GitHub Actions re-run no toma secrets actualizados
**Causa:** Cuando haces "Re-run" de un workflow fallido, GitHub puede usar la caché del run anterior incluyendo los secrets del momento original.  
**Solución:** Hacer un nuevo commit para disparar un run completamente nuevo que sí tome los secrets actualizados.

---

## 💡 LECCIONES APRENDIDAS

1. **Verificar siempre la carpeta** con `pwd` antes de ejecutar cualquier cosa
2. **Clave privada vs pública:** privada = secreta (nunca compartir), pública = se puede compartir
3. **Ubuntu vs CentOS:** muchos comandos difieren. En Ubuntu: `ssh`, `apt`. En CentOS: `sshd`, `yum`
4. **SSH no carga el PATH completo** cuando ejecuta scripts remotos — usar rutas absolutas
5. **`PubkeyAuthentication`** debe estar en `yes` para que funcionen las claves SSH
6. **`chmod 600 authorized_keys`** es obligatorio — SSH ignora el archivo si los permisos son incorrectos
7. **`sudo sshd -T | grep ...`** es más confiable que leer el archivo de config directamente
8. **GitHub Actions** requiere que el VPS tenga la clave pública en `authorized_keys` Y que `PubkeyAuthentication yes` esté activo
9. **Re-runs** en GitHub Actions no siempre toman los secrets actualizados — mejor hacer un nuevo commit
10. **HTTPS en git** es más simple que SSH cuando no se requiere autenticación de deploy automática
