<?php
// Usa a forma padrão de inclusão de ambiente do GLPI
include('../../../inc/includes.php');

$categoryId = isset($_POST['category_id']) ? intval($_POST['category_id']) : 0;

if ($categoryId > 0) {
    $path = [];
    $currentId = $categoryId;
    $itil_category = new ITILCategory();

    // Loop para encontrar todos os pais até à raiz, max 10 níveis para prevenir loops infinitos
    for ($i = 0; $i < 10 && $currentId > 0; $i++) {
        // Adiciona o ID atual ao início do array do caminho
        array_unshift($path, $currentId);
        
        // Encontra o pai da categoria atual
        if ($itil_category->getFromDB($currentId)) {
            $currentId = $itil_category->fields['itilcategories_id'];
        } else {
            // Categoria não encontrada, quebra o loop
            $currentId = 0;
        }
    }
    
    // Envia o caminho como uma resposta JSON
    header('Content-Type: application/json');
    echo json_encode($path);
} else {
    // Nenhum ID fornecido, retorna um array vazio
    header('Content-Type: application/json');
    echo json_encode([]);
}
