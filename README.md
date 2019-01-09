# HaftenApp

# Pasos

## Instalar

> JWT Authentication for WP-API

## **En wp-config.php**

En los define del archivo pegar

```php
define('JWT_AUTH_CORS_ENABLE', true);
```

## **Ir a**

[https://api.wordpress.org/secret-key/1.1/salt/](https://api.wordpress.org/secret-key/1.1/salt/)

copiar la clave de `define('SECURE_AUTH_KEY' 'Clave');`

pegar en archivo wp-config.php `define('JWT_AUTH_SECRET_KEY', 'Clave');`

---

## Excel

Tomar de Ejemplo los archivos adjuntos

---

## Angular App

1. Ir a wp-admin, en la seecion de WooCommerce > settings > Api y habilitar `Enable the REST API`
2. En esa misma pantalla ir a la sección "Key/Apps" y "add key" se agrega una key con todos los permisos, al momento de dar "generar key" aparecera la dos llaves, **es importante guardarlas**
3. `consumer_key` y `consumer_secret` son la llaves que hay que pegar en el codigo

Cambiar en src/app/\_config/url.api.ts

```TypeScript
export const URL_SERVER = 'http://URL.com/wp-json';
export const KEYS_WOO =
  'consumer_key=ck_47faa6b46cf34be8b66cbde045893a11b7ef4900&consumer_secret=cs_6dfff471aa74ec8d128438008c51273cf4031d4f'
```

---

Por si hay problemas

## **En .httpacces**

<RewriteEngine on>
en la primera parte:

1. RewriteCond %{HTTP:Authorization} ^(.\*)
2. RewriteRule ^(.\*) - [E=HTTP_AUTHORIZATION:%1]
3. SetEnvIf Authorization "(.\*)" HTTP_AUTHORIZATION=\$1

---

### Extras

> Pods

Crea contenido con campos

💥**Recordar**💥

- Cuando se abilita la pestaña REST API hay que seleccionar todos los check box (pods)

- El Json para hcer `post` a cualquier seccion debe de tener como minimo:

```JSON
{
	 "nombre": "algo1",
	 "title": "Algo1",
	 "status": "publish"
}
```

Ejemplo de htaccess:

```.htaccess
Header set Access-Control-Allow-Origin *
<IfModule mod_rewrite.c>
RewriteEngine On
RewriteBase /
RewriteRule ^index\.php$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.php [L]
</IfModule>

# BEGIN WordPress
<IfModule mod_rewrite.c>
	RewriteEngine On
	RewriteBase /
	RewriteRule ^/wp-content/hostinger-page-cache/ - [L]
	RewriteCond %{REQUEST_METHOD} !POST
	RewriteCond %{QUERY_STRING} !.*=.*
	RewriteCond %{HTTP_COOKIE} !(wordpress_test_cookie|comment_author|wp\-postpass|wordpress_logged_in|wptouch_switch_toggle|wp_woocommerce_session_) [NC]
	RewriteCond %{DOCUMENT_ROOT}/wp-content/hostinger-page-cache/$1/_index.html -f
	RewriteRule ^(.*)$ /wp-content/hostinger-page-cache/$1/_index.html [L]
    RewriteCond %{HTTP:Authorization} ^(.*)
RewriteRule ^(.*) - [E=HTTP_AUTHORIZATION:%1]
SetEnvIf Authorization "(.*)" HTTP_AUTHORIZATION=$1
</IfModule>
<IfModule mod_expires.c>
	ExpiresActive On
	ExpiresByType image/jpg "access plus 5 minutes"
	ExpiresByType image/jpeg "access plus 5 minutes"
	ExpiresByType image/gif "access plus 5 minutes"
	ExpiresByType image/png "access plus 5 minutes"
	ExpiresByType text/css "access plus 5 minutes"
	ExpiresByType application/pdf "access plus 10 minutes"
	ExpiresByType text/javascript "access plus 5 minutes"
	ExpiresByType image/x-icon "access plus 30 minutes"
	ExpiresDefault "access plus 3 minutes"
</IfModule>
<IfModule mod_rewrite.c>
RewriteEngine On
RewriteBase /
RewriteRule ^index\.php$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.php [L]
</IfModule>

# END WordPress
# DO NOT REMOVE THIS LINE AND THE LINES BELOW ERRORPAGEID:dyHuMe
ErrorDocument 404 /404.html
# DO NOT REMOVE THIS LINE AND THE LINES ABOVE dyHuMe:ERRORPAGEID
```
