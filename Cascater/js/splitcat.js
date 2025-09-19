$(function() {
    const originalCatSelector = 'select[name="itilcategories_id"], select[data-itemtype="ITILCategory"]';
    const typeSelector = 'select[name="type"]';
    const hiddenInputId = 'cascater_hidden_cat';

    function initSplitCat() {
        const $originalSelect = $(originalCatSelector);
        
        if ($originalSelect.length === 0 || $('#splitcat_container').length > 0) {
            return;
        }
        
        const $fieldContainer = $originalSelect.closest('.form-group, .field, td');
        const $elementToHide = $fieldContainer.length > 0 ? $fieldContainer : $originalSelect.parent();
        $elementToHide.hide();

        const hiddenInput = $(`<input type="hidden" name="itilcategories_id" id="${hiddenInputId}">`);
        $originalSelect.after(hiddenInput);
        $originalSelect.attr('name', 'itilcategories_id_original_disabled');

        const container = $('<div id="splitcat_container"></div>');
        $elementToHide.after(container);
        
        const initialType = $(typeSelector).val();
        const selectedCategoryId = $originalSelect.val();

        // Se estiver a editar um chamado com uma categoria já definida
        if (selectedCategoryId > 0) {
            hiddenInput.val(selectedCategoryId); // Define o valor do campo oculto imediatamente
            // Pede o caminho completo da categoria ao servidor
            $.post('/plugins/Cascater/ajax/get_category_path.php', {
                category_id: selectedCategoryId,
                _glpi_csrf_token: $('input[name="_glpi_csrf_token"]').val()
            })
            .done(function(path) {
                if (path && path.length > 0) {
                    // Inicia o carregamento dos menus, pré-selecionando o caminho
                    loadCategories(0, container, 0, initialType, hiddenInput, path, 0);
                } else {
                    // Fallback caso o caminho não seja encontrado
                    loadCategories(0, container, 0, initialType, hiddenInput);
                }
            });
        } else {
            // Para um novo chamado, apenas carrega as categorias raiz
            loadCategories(0, container, 0, initialType, hiddenInput);
        }

        $(typeSelector).on('change', function() {
            const newType = $(this).val();
            container.empty();
            hiddenInput.val(0);
            loadCategories(0, container, 0, newType, hiddenInput);
        });
    }

    function loadCategories(parentId, $container, level, ticketType, $hiddenInput, pathArray = null, pathIndex = 0) {
        const ajaxUrl = '/plugins/Cascater/ajax/get_categories.php';
        
        $.post(ajaxUrl, { 
            parent_id: parentId, 
            level: level, 
            type: ticketType,
            _glpi_csrf_token: $('input[name="_glpi_csrf_token"]').val() 
        })
        .done(function(response) {
            if (response.trim() === '') {
                return;
            }

            const $newSelect = $(response);
            $container.append($newSelect);

            $newSelect.on('change', function() {
                const selectedId = $(this).val();
                $(this).nextAll('.splitcat-select').remove();
                
                if (selectedId > 0) {
                    $hiddenInput.val(selectedId);
                    loadCategories(selectedId, $container, level + 1, ticketType, $hiddenInput);
                } else {
                    const $previousSelect = $(this).prev('.splitcat-select');
                    const parentValue = $previousSelect.length > 0 ? $previousSelect.val() : '0';
                    $hiddenInput.val(parentValue);
                }
            });

            // Se estivermos no modo de "pré-seleção" para um chamado existente
            if (pathArray && pathIndex < pathArray.length) {
                const categoryToSelect = pathArray[pathIndex];
                $newSelect.val(categoryToSelect);
                
                // Se houver mais níveis no caminho, carrega o próximo
                if (pathIndex < pathArray.length) {
                    loadCategories(categoryToSelect, $container, level + 1, ticketType, $hiddenInput, pathArray, pathIndex + 1);
                }
            }
        })
        .fail(function(jqXHR) {
            console.error("Plugin Cascater: Falha na chamada AJAX!", jqXHR.responseText);
        });
    }
    
    setTimeout(initSplitCat, 500);
});
