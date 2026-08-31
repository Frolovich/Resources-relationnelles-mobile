# ================================================
# Dockerfile — Symfony Backend (PHP 8.2 + Apache)
# ================================================
# Utilise PHP avec Apache intégré pour simplifier
# (pas besoin de NGINX séparé pour le backend)
#
# Build : docker build -t ressources-backend .
# Run   : docker run -p 8000:80 ressources-backend
# ================================================

FROM php:8.2-apache

# Activer mod_rewrite pour Symfony
RUN a2enmod rewrite

# Extensions PHP nécessaires
RUN apt-get update && apt-get install -y \
    libicu-dev \
    libzip-dev \
    libonig-dev \
    unzip \
    git \
    && docker-php-ext-install \
    intl \
    pdo_mysql \
    zip \
    mbstring \
    opcache \
    && rm -rf /var/lib/apt/lists/*

# Installer Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Config Apache — pointer vers public/
ENV APACHE_DOCUMENT_ROOT=/var/www/backend/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf \
    && sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

# AllowOverride pour .htaccess Symfony
RUN echo '<Directory /var/www/backend/public>\n\
    AllowOverride All\n\
    Require all granted\n\
</Directory>' > /etc/apache2/conf-available/symfony.conf \
    && a2enconf symfony

# PHP upload limits (pour vidéos jusqu'à 200 MB)
RUN echo "upload_max_filesize = 200M\npost_max_size = 210M\nmemory_limit = 256M\nmax_execution_time = 120" > /usr/local/etc/php/conf.d/uploads.ini

# Répertoire de travail
WORKDIR /var/www/backend

# Copier composer files d'abord (cache Docker)
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-source

# Copier le code
COPY . .

# Finaliser
RUN composer dump-autoload --optimize --no-dev \
    && mkdir -p var/cache var/log \
    && chown -R www-data:www-data var/

EXPOSE 80

CMD ["apache2-foreground"]
