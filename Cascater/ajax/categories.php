<?php

/**
 * ------------------------------------------------------------------------
 * Cascater - árvore de categorias ITIL visíveis para o usuário atual
 * ------------------------------------------------------------------------
 *
 * GET ajax/categories.php?entity=<id>&type=<1|2>
 *
 * Retorna, em JSON, todas as categorias que o usuário pode escolher, já
 * filtradas pelas mesmas regras do campo nativo do GLPI:
 *   - entidades ativas do usuário (ou a entidade do chamado), com recursividade;
 *   - "Visível na interface simplificada" quando o usuário está no helpdesk;
 *   - "Visível para incidentes / requisições" conforme o tipo do chamado.
 *
 * Categorias que não atendem aos filtros, mas são pais de categorias válidas,
 * também são retornadas com "selectable": false, para permitir a navegação.
 *
 * This file is part of Cascater project (GPLv3+).
 * ------------------------------------------------------------------------
 */

// GLPI 10 executa este script diretamente; o GLPI 11 já carrega o ambiente antes.
if (!defined('GLPI_ROOT')) {
    include __DIR__ . '/../../../inc/includes.php';
}

Session::checkLoginUser();

/** @var DBmysql $DB */
global $DB;

$table = ITILCategory::getTable();

// Entidade do chamado, se o usuário tiver acesso a ela; senão, as entidades ativas.
$entity = $_GET['entity'] ?? '';
$entity_restrict = '';
if (is_numeric($entity) && (int) $entity >= 0 && Session::haveAccessToEntity((int) $entity)) {
    $entity_restrict = (int) $entity;
}

$where = [
    getEntitiesRestrictCriteria($table, '', $entity_restrict, true),
];

if (Session::getCurrentInterface() === 'helpdesk') {
    $where[] = ['is_helpdeskvisible' => 1];
}

$type = (int) ($_GET['type'] ?? 0);
if ($type === Ticket::INCIDENT_TYPE) {
    $where[] = ['is_incident' => 1];
} elseif ($type === Ticket::DEMAND_TYPE) {
    $where[] = ['is_request' => 1];
} else {
    $where[] = ['OR' => ['is_incident' => 1, 'is_request' => 1]];
}

$nodes = [];
$iterator = $DB->request([
    'SELECT' => ['id', 'name', 'itilcategories_id'],
    'FROM'   => $table,
    'WHERE'  => $where,
]);
foreach ($iterator as $row) {
    $nodes[(int) $row['id']] = [
        'id'         => (int) $row['id'],
        'parent'     => (int) $row['itilcategories_id'],
        'name'       => (string) $row['name'],
        'selectable' => true,
    ];
}

// Adiciona os ancestrais ausentes (somente navegação), nível a nível.
for ($depth = 0; $depth < 30; $depth++) {
    $missing = [];
    foreach ($nodes as $node) {
        if ($node['parent'] > 0 && !isset($nodes[$node['parent']])) {
            $missing[$node['parent']] = $node['parent'];
        }
    }
    if ($missing === []) {
        break;
    }

    $found = 0;
    foreach ($DB->request(['SELECT' => ['id', 'name', 'itilcategories_id'], 'FROM' => $table, 'WHERE' => ['id' => array_values($missing)]]) as $row) {
        $nodes[(int) $row['id']] = [
            'id'         => (int) $row['id'],
            'parent'     => (int) $row['itilcategories_id'],
            'name'       => (string) $row['name'],
            'selectable' => false,
        ];
        $found++;
    }
    if ($found === 0) {
        // Pai inexistente (base inconsistente): trata os filhos como raiz.
        foreach ($nodes as &$node) {
            if (isset($missing[$node['parent']])) {
                $node['parent'] = 0;
            }
        }
        unset($node);
    }
}

if ($nodes !== [] && Session::haveTranslations('ITILCategory', 'name')) {
    foreach ($nodes as &$node) {
        $node['name'] = DropdownTranslation::getTranslatedValue(
            $node['id'],
            'ITILCategory',
            'name',
            $_SESSION['glpilanguage'],
            $node['name']
        );
    }
    unset($node);
}

header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store');
echo json_encode(array_values($nodes), JSON_UNESCAPED_UNICODE);
