<?php
// Usa a forma padrão de inclusão de ambiente do GLPI
include('../../../inc/includes.php');

$parentId = isset($_POST['parent_id']) ? intval($_POST['parent_id']) : 0;
$level = isset($_POST['level']) ? intval($_POST['level']) : 0;
$ticketType = isset($_POST['type']) ? intval($_POST['type']) : 0;

// Se o tipo de chamado não for válido (condição de corrida), assume "Incidente" como padrão.
if ($ticketType != 1 && $ticketType != 2) {
    $ticketType = 1;
}

$itil_category = new ITILCategory();
$conditions = ['itilcategories_id' => $parentId];

// Para a primeira seleção (nível 0), não filtramos por tipo.
// Para as subcategorias (nível > 0), o filtro é aplicado.
if ($level > 0) {
    if ($ticketType == 1) { // 1 = Incidente
        $conditions['is_incident'] = 1;
    } else { // 2 = Requisição
        $conditions['is_request'] = 1;
    }
} else {
    // Para o nível 0, precisamos de garantir que pelo menos um dos tipos é visível
    // para evitar mostrar categorias que não servem para nada.
    $conditions['OR'] = [
        'is_incident' => 1,
        'is_request'  => 1
    ];
}

$childCategories = $itil_category->find($conditions, ['completename']);

if (count($childCategories) > 0) {
    $html = "<select class='splitcat-select glpi_dropdown'><option value='0'>---</option>";
    foreach ($childCategories as $id => $category) {
        $sanitized_name = htmlspecialchars($category['name'], ENT_QUOTES, 'UTF-8');
        $html .= "<option value='$id'>" . $sanitized_name . "</option>";
    }
    $html .= "</select>";
    echo $html;
}
