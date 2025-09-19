<?php

/**
 * ------------------------------------------------------------------------
 * Cascater
 *
 * Plugin para GLPI que divide a seleção de categorias de chamados
 * em múltiplos menus suspensos dinâmicos.
 *
 * Copyright (C) 2024 by G. Martins
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

define('PLUGIN_CASCATER_VERSION', '2.0.1');
define('PLUGIN_CASCATER_MIN_GLPI', '10.0.0');
define('PLUGIN_CASCATER_MAX_GLPI', '10.9.99');

/**
 * Função de inicialização do plugin.
 * Define os hooks necessários para o funcionamento.
 */
function plugin_init_Cascater() {
    global $PLUGIN_HOOKS;

    $PLUGIN_HOOKS['csrf_compliant']['Cascater'] = true;

    // Registra os ficheiros JavaScript a serem carregados nas páginas de chamado
    $PLUGIN_HOOKS['add_javascript']['Cascater'] = [
        'ticket.form.php'     => 'js/splitcat.js',
        'helpdesk.public.php' => 'js/splitcat.js'
    ];
    
    // Registra os ficheiros CSS a serem carregados
    $PLUGIN_HOOKS['add_css']['Cascater'] = [
         'ticket.form.php'     => 'css/splitcat.css',
         'helpdesk.public.php' => 'css/splitcat.css'
    ];
}

/**
 * Função que retorna as informações do plugin para a interface do GLPI.
 * @return array
 */
function plugin_version_Cascater() {
    return [
        'name'           => 'Cascater',
        'version'        => PLUGIN_CASCATER_VERSION,
        'author'         => 'G. Martins',
        'license'        => 'GPLv3',
        'homepage'       => '',
        'requirements'   => [
            'glpi' => [
                'min' => PLUGIN_CASCATER_MIN_GLPI,
                'max' => PLUGIN_CASCATER_MAX_GLPI,
            ],
        ],
    ];
}

/**
 * Função para verificar pré-requisitos antes da instalação.
 * @return boolean
 */
function plugin_Cascater_check_prerequisites() {
    // Atualmente não há pré-requisitos, retorna sempre verdadeiro.
    return true;
}

/**
 * Função para verificar a configuração do plugin.
 * @param boolean $verbose
 * @return boolean
 */
function plugin_Cascater_check_config($verbose = false) {
    if ($verbose) {
        echo 'Instalado e pronto para usar.';
    }
    return true;
}

// Funções de instalação e desinstalação
function plugin_Cascater_install() {
    return true;
}

function plugin_Cascater_uninstall() {
    return true;
}
