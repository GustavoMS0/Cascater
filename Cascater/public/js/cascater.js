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
    // Espera máxima pela atualização do campo original após trocar o tipo ou a entidade
    const FIELD_UPDATE_TIMEOUT = 1500;
    // Textos padrão; os traduzidos chegam do servidor junto com as categorias
    const DEFAULT_STRINGS = {
        field: 'Categoria',
        level: '%1$s (nível %2$s)',
        unavailable: 'Categoria atual: %1$s (não disponível para este tipo de chamado)',
    };
    const treeCache = {};
    let uidCounter = 0;

    /** Preenche %1$s, %2$s... (formato das traduções do GLPI). */
    function format(template) {
        const args = Array.prototype.slice.call(arguments, 1);
        return String(template).replace(/%(\d+)\$s/g, function (match, n) {
            const value = args[parseInt(n, 10) - 1];
            return value === undefined ? match : String(value);
        });
    }

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

    function buildTree(data) {
        // Formato atual: { categories, strings }; versões anteriores devolviam só a lista
        const list = Array.isArray(data) ? data : ((data && data.categories) || []);
        const strings = $.extend({}, DEFAULT_STRINGS, (data && data.strings) || {});
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
        return { byId: byId, children: children, strings: strings };
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

        const $wrapper = $select.parent();
        let $tempBox = $wrapper.find('.cascater');
        if (!$tempBox.length) {
            $tempBox = $('<div class="cascater is-loading"></div>');
            $select.after($tempBox);
            $wrapper.addClass('cascater-enhanced');
        } else {
            $tempBox.addClass('is-loading');
        }

        const ctx = getContext($select);
        fetchTree(ctx.entity, ctx.type)
            .done(function (tree) {
                if (document.contains(select)) {
                    render($select, tree);
                }
            })
            .fail(function (xhr) {
                $select.removeData('cascater');
                $tempBox.removeClass('is-loading').remove();
                $wrapper.removeClass('cascater-enhanced');
                console.warn('Cascater: falha ao carregar categorias, mantendo o campo padrão.', xhr && xhr.status);
            })
            .always(function () {
                $tempBox.removeClass('is-loading');
            });
    }

    function render($select, tree) {
        const $wrapper = $select.parent();
        const current = parseInt($select.val(), 10) || 0;
        const $label = getLabel($select);

        // Sem categorias disponíveis: mantém o campo nativo.
        if (!(tree.children[0] || []).length) {
            $wrapper.removeClass('cascater-enhanced');
            restoreLabel($label);
            return;
        }

        // Identificador estável do campo (ids dos menus e namespace do handler do formulário)
        let uid = $select.data('cascaterUid');
        if (!uid) {
            uid = ++uidCounter;
            $select.data('cascaterUid', uid);
        }
        function levelId(number) {
            return 'cascater-' + uid + '-level-' + number;
        }

        // Nome acessível dos menus: o texto do rótulo original (sem o "*" de obrigatório)
        const fieldName = ($label.text() || '').replace(/\s+/g, ' ').replace(/\s*\*\s*$/, '').trim()
            || tree.strings.field;

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
                format(tree.strings.unavailable, currentText)
            ));
        }

        function addLevel(parentId, selectedId) {
            const items = tree.children[parentId] || [];
            if (!items.length) {
                return false;
            }
            const number = $box.children('.cascater-level').length + 1;
            const $level = $('<select class="form-select cascater-level"></select>');
            $level.attr({
                id: levelId(number),
                'aria-label': number === 1 ? fieldName : format(tree.strings.level, fieldName, number),
            });
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

        // O rótulo do campo passa a apontar para o primeiro menu visível.
        if ($label.length) {
            $label.attr('for', levelId(1));
        }

        /** Desfaz a cascata: volta ao campo nativo. */
        function teardown() {
            $box.remove();
            $wrapper.removeClass('cascater-enhanced');
            restoreLabel($label);
        }

        // Troca de tipo ou de entidade sem recriar o campo (o GLPI 11 recria; o observer cuida disso).
        // Um namespace por campo: vários campos de categoria no mesmo formulário são todos refeitos.
        const $form = $select.closest('form');
        const ns = 'change.cascater-' + uid;
        $form.off(ns).on(ns, '[name="type"], [name="entities_id"]', function () {
            if (!document.contains($select[0])) {
                $form.off(ns); // campo recriado pelo GLPI: o novo tem o seu próprio handler
                return;
            }
            if ($select.data('cascaterWaiting')) {
                return;
            }
            $select.data('cascaterWaiting', true);
            // Espera o GLPI atualizar o campo original (opções ou o próprio campo trocados)
            // antes de ler a entidade/tipo novos; se nada mudar, refaz após o tempo limite.
            waitForFieldUpdate($select[0], $form[0] || document.body, function () {
                $select.removeData('cascaterWaiting');
                if (!document.contains($select[0])) {
                    teardown();
                    return;
                }
                if ($select.data('cascater')) {
                    teardown();
                    $select.removeData('cascater');
                    enhance($select[0]);
                }
            });
        });
    }

    /**
     * Chama "callback" quando o campo original de categoria mudar (opções, atributos,
     * evento change ou o campo removido/recriado pelo GLPI), ou após FIELD_UPDATE_TIMEOUT.
     */
    function waitForFieldUpdate(select, scope, callback) {
        const $field = $(select);
        let finished = false;
        let timer = null;
        let observer = null;

        function finish(delay) {
            if (finished) {
                return;
            }
            finished = true;
            observer.disconnect();
            $field.off('change.cascater-wait');
            clearTimeout(timer);
            // Pequena folga para o GLPI terminar de montar o campo (ex.: select2_configs)
            setTimeout(callback, delay);
        }

        observer = new MutationObserver(function (mutations) {
            const changed = !document.contains(select) || mutations.some(function (mutation) {
                return mutation.target === select;
            });
            if (changed) {
                finish(50);
            }
        });
        observer.observe(select, { childList: true, attributes: true });
        observer.observe(scope, { childList: true, subtree: true });
        $field.on('change.cascater-wait', function () {
            finish(50);
        });
        timer = setTimeout(function () {
            finish(0);
        }, FIELD_UPDATE_TIMEOUT);
    }

    /** Rótulo (<label for>) do campo original de categoria. */
    function getLabel($select) {
        const saved = $select.data('cascaterLabel');
        if (saved && saved.length && document.contains(saved[0])) {
            return saved;
        }
        const id = $select.attr('id');
        const $scope = $select.closest('form').length ? $select.closest('form') : $(document);
        const $label = id ? $scope.find('label').filter(function () {
            return this.htmlFor === id;
        }).first() : $();
        if ($label.length) {
            $label.data('cascaterFor', id);
            $select.data('cascaterLabel', $label);
        }
        return $label;
    }

    function restoreLabel($label) {
        if ($label && $label.length && $label.data('cascaterFor')) {
            $label.attr('for', $label.data('cascaterFor'));
        }
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
