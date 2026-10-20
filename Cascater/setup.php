<?php

/**
 * ------------------------------------------------------------------------
 * Cascater
 *
 * Plugin para GLPI que divide a seleção de categorias de chamados
 * em múltiplos menus suspensos dinâmicos (em cascata).
 *
 * Copyright (C) 2024-2026 by G. Martins
 * ------------------------------------------------------------------------
 *
 * LICENSE
 *
 * This file is part of Cascater project.
 *
 * Cascater is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Cascater is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Cascater. If not, see <http://www.gnu.org/licenses/>.
 * ------------------------------------------------------------------------
 */

define('PLUGIN_CASCATER_VERSION', '3.0.0');
define('PLUGIN_CASCATER_MIN_GLPI', '10.0.0');
define('PLUGIN_CASCATER_MAX_GLPI', '11.0.99');

/**
 * Páginas em que o plugin atua. O hook "add_javascript" do GLPI ignora o nome
 * da página e carrega o arquivo em todas as telas, por isso o filtro é feito aqui.
 */
function plugin_cascater_is_target_page(): bool
{
    $uri = parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH) ?: '';

    foreach (['/front/ticket.form.php', '/front/helpdesk.public.php', '/front/tracking.injector.php'] as $page) {
        if (str_ends_with($uri, $page)) {
            return true;
        }
    }
    return false;
}

/**
 * Inicialização do plugin: registra os hooks.
 */
function plugin_init_cascater()
{
    global $PLUGIN_HOOKS;

    $PLUGIN_HOOKS['csrf_compliant']['cascater'] = true;
    $PLUGIN_HOOKS['csrf_compliant']['Cascater'] = true;

    if (!plugin_cascater_is_target_page()) {
        return;
    }

    // GLPI 11 serve os arquivos estáticos a partir da pasta "public/" do plugin
    // (URL sem o prefixo "public"); o GLPI 10 usa o caminho real a partir da raiz do plugin.
    $prefix = version_compare(GLPI_VERSION, '11.0.0-dev', '>=') ? '' : 'public/';

    $PLUGIN_HOOKS['add_javascript']['cascater'] = [$prefix . 'js/cascater.js'];
    $PLUGIN_HOOKS['add_javascript']['Cascater'] = [$prefix . 'js/cascater.js'];
    $PLUGIN_HOOKS['add_css']['cascater']        = [$prefix . 'css/cascater.css'];
    $PLUGIN_HOOKS['add_css']['Cascater']        = [$prefix . 'css/cascater.css'];
}

/**
 * Informações do plugin exibidas em Configurar > Plugins.
 */
function plugin_version_cascater()
{
    return [
        'name'         => 'Cascater',
        'version'      => PLUGIN_CASCATER_VERSION,
        'author'       => 'G. Martins',
        'license'      => 'GPLv3+',
        'homepage'     => 'https://github.com/GustavoMS0/Cascater',
        'requirements' => [
            'glpi' => [
                'min' => PLUGIN_CASCATER_MIN_GLPI,
                'max' => PLUGIN_CASCATER_MAX_GLPI,
            ],
        ],
    ];
}

function plugin_cascater_check_prerequisites()
{
    return true;
}

function plugin_cascater_check_config($verbose = false)
{
    return true;
}

// O plugin não cria tabelas nem configurações.
function plugin_cascater_install()
{
    return true;
}

function plugin_cascater_uninstall()
{
    return true;
}
