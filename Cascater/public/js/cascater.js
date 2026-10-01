/**
 * Cascater - seleção de categorias ITIL em cascata (GLPI 10 e 11)
 *
 * O campo original de categoria continua no formulário (oculto) e é sempre
 * mantido sincronizado. Assim o envio, as validações e os modelos de chamado
 * do GLPI continuam funcionando normalmente.
 *
 * This file is part of Cascater project (GPLv3+).
 */
(function ($) {
    'use strict';

    if (!$) {
        return;
    }

    // .../plugins/Cascater[/public]/js/cascater.js?v=x  ->  .../plugins/Cascater
    const scriptSrc = (document.currentScript && document.currentScript.src) || '';
    const pluginBase = scriptSrc.replace(/\/js\/cascater\.js(\?.*)?$/, '').replace(/\/public$/, '');
    const ENDPOINT = pluginBase + '/ajax/categories.php';

    const FIELD_SELECTOR = 'select[name="itilcategories_id"]';
    const EMPTY_LABEL = '-----';
    const treeCache = {};

    /** Busca (uma vez por entidade/tipo) a árvore de categorias permitidas. */
    function fetchTree(entity, type) {
        const key = entity + '|' + type;
        if (!treeCache[key]) {
            treeCache[key] = $.getJSON(ENDPOINT, { entity: entity, type: type }).then(buildTree);
            treeCache[key].fail(function () {
                delete treeCache[key];
            });
        }
        return treeCache[key];
    }

    function buildTree(list) {
        const byId = {};
        const children = {};
        (Array.isArray(list) ? list : []).forEach(function (node) {
            byId[node.id] = node;
        });
        Object.keys(byId).forEach(function (id) {
            const node = byId[id];
            const parent = byId[node.parent] ? node.parent : 0;
            (children[parent] = children[parent] || []).push(node);
        });
        Object.keys(children).forEach(function (parent) {
            children[parent].sort(function (a, b) {
                return a.name.localeCompare(b.name, undefined, { sensitivity: 'base', numeric: true });
            });
        });
        return { byId: byId, children: children };
    }

    /** Entidade e tipo do chamado ao qual o campo pertence. */
    function getContext($select) {
        const $form = $select.closest('form');
        const type = parseInt($form.find('[name="type"]').first().val(), 10) || 0;

        let entity = '';
        const config = window.select2_configs && window.select2_configs[$select.attr('id')];
        const restrict = config && config.params ? config.params.entity_restrict : undefined;
        if (restrict !== undefined && restrict !== null && /^\d+$/.test(String(restrict))) {
            entity = String(restrict);
        } else {
            const formEntity = $form.find('[name="entities_id"]').first().val();
            if (/^\d+$/.test(String(formEntity))) {
                entity = String(formEntity);
            }
        }
        return { entity: entity, type: type };
    }

    function enhance(select) {
        const $select = $(select);
        if ($select.data('cascater') || select.disabled || select.multiple) {
            return;
        }
        $select.data('cascater', true);

        const ctx = getContext($select);
        fetchTree(ctx.entity, ctx.type)
            .done(function (tree) {
                if (document.contains(select)) {
                    render($select, tree);
                }
            })
            .fail(function (xhr) {
                $select.removeData('cascater');
                console.warn('Cascater: falha ao carregar categorias, mantendo o campo padrão.', xhr && xhr.status);
            });
    }

    function render($select, tree) {
        const $wrapper = $select.parent();
        const current = parseInt($select.val(), 10) || 0;

        // Sem categorias disponíveis: mantém o campo nativo.
        if (!(tree.children[0] || []).length) {
            $wrapper.removeClass('cascater-enhanced');
            return;
        }

        const path = [];
        for (let id = current, guard = 0; id > 0 && tree.byId[id] && guard < 50; guard++) {
            path.unshift(id);
            id = tree.byId[id].parent;
        }

        const $box = $('<div class="cascater"></div>');
        $select.siblings('.cascater').remove();
        $select.after($box);
        $wrapper.addClass('cascater-enhanced');

        // Categoria atual fora dos filtros (ex.: tipo do chamado alterado): mostra qual é,
        // sem alterá-la, até o usuário escolher outra.
        if (current > 0 && !tree.byId[current]) {
            const currentText = $select.find('option:selected').text() || ('#' + current);
            $box.append($('<div class="cascater-current"></div>').text(
                'Categoria atual: ' + currentText + ' (não disponível para este tipo de chamado)'
            ));
        }

        function addLevel(parentId, selectedId) {
            const items = tree.children[parentId] || [];
            if (!items.length) {
                return false;
            }
            const $level = $('<select class="form-select cascater-level"></select>');
            $level.append(new Option(EMPTY_LABEL, '0'));
            items.forEach(function (node) {
                const option = new Option(node.name, String(node.id));
                if (!node.selectable) {
                    option.className = 'cascater-nav-only';
                }
                $level.append(option);
            });
            $level.val(String(selectedId || 0));
            $box.append($level);
            return true;
        }

        function nearestSelectable(id) {
            for (let guard = 0; id > 0 && tree.byId[id] && guard < 50; guard++) {
                if (tree.byId[id].selectable) {
                    return id;
                }
                id = tree.byId[id].parent;
            }
            return 0;
        }

        /**
         * Atualiza o campo original. "notify" dispara o evento change do GLPI,
         * que em chamados novos recarrega o formulário para aplicar o modelo
         * da categoria; por isso só é usado ao escolher uma categoria final.
         */
        function setValue(id, notify) {
            const value = String(id);
            if (!$select.find('option').filter(function () { return this.value === value; }).length) {
                $select.append(new Option(id > 0 ? tree.byId[id].name : EMPTY_LABEL, value));
            }
            $select.val(value);
            if (notify) {
                $select.trigger('change');
            }
        }

        $box.on('change', '.cascater-level', function () {
            const $level = $(this);
            $box.children('.cascater-current').remove();
            $level.nextAll('.cascater-level').remove();
            const id = parseInt($level.val(), 10) || 0;

            if (id > 0) {
                const hasChildren = addLevel(id, 0);
                const target = nearestSelectable(id);
                setValue(target, !hasChildren && target === id);
            } else {
                const $previous = $level.prevAll('.cascater-level').first();
                setValue(nearestSelectable(parseInt($previous.val(), 10) || 0), false);
            }
        });

        // Monta os níveis já preenchidos (chamado existente ou recarregado).
        addLevel(0, path[0]);
        path.forEach(function (id, index) {
            addLevel(id, path[index + 1]);
        });

        // Troca de tipo sem recriar o campo (o GLPI 11 recria; o observer cuida disso).
        $select.closest('form').off('change.cascater').on('change.cascater', '[name="type"]', function () {
            setTimeout(function () {
                if (document.contains($select[0]) && $select.data('cascater')) {
                    $box.remove();
                    $wrapper.removeClass('cascater-enhanced');
                    $select.removeData('cascater');
                    enhance($select[0]);
                }
            }, 300);
        });
    }

    function scan(root) {
        $(root).find(FIELD_SELECTOR).addBack(FIELD_SELECTOR).each(function () {
            enhance(this);
        });
    }

    $(function () {
        scan(document);
        // Campos criados depois (ex.: GLPI recarrega a categoria ao trocar o tipo).
        new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                mutation.addedNodes.forEach(function (node) {
                    if (node.nodeType === 1) {
                        scan(node);
                    }
                });
            });
        }).observe(document.body, { childList: true, subtree: true });
    });
})(window.jQuery);
