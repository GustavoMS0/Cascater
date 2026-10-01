# Changelog

## [3.0.0] - 2026-10-01

### Adicionado
- Compatibilidade com o **GLPI 11.0.x**, mantendo o suporte ao GLPI 10.0.x.
- Respeito às **entidades** do usuário e do chamado, incluindo categorias recursivas.
- Respeito à opção **"Visível na interface simplificada"** para usuários do autoatendimento.
- Integração com **modelos de chamado**: ao escolher a categoria final em um chamado novo, o formulário é recarregado e o modelo da categoria é aplicado, como no campo nativo.
- Categorias que não valem para o tipo do chamado, mas têm subcategorias válidas, aparecem para navegação (em itálico).
- Suporte a traduções de categorias (quando ativadas no GLPI).
- Release automática com o `.zip` do plugin via GitHub Actions.

### Corrigido
- O script era carregado em **todas as telas** do GLPI e podia alterar o campo de categoria de Problemas, Mudanças e outras telas. Agora só atua no formulário de chamado.
- O endereço fixo `/plugins/Cascater/...` quebrava quando o GLPI estava em uma subpasta ou na pasta `marketplace`.
- As consultas de categoria eram acessíveis sem login.
- O filtro por tipo de chamado não era aplicado no primeiro nível.
- A inicialização dependia de um atraso fixo de 500 ms; agora reage quando o campo aparece na tela, inclusive quando o GLPI recria o campo ao trocar o tipo.

### Alterado
- A árvore de categorias é carregada **uma única vez** por formulário (antes era uma requisição por nível).
- O campo original permanece no formulário, apenas oculto, e é sempre sincronizado.
- Arquivos estáticos movidos para `public/`, padrão exigido pelo GLPI 11.
- Arquivos renomeados de `splitcat.*` para `cascater.*`.

### Removido
- `ajax/get_categories.php` e `ajax/get_category_path.php`, substituídos por `ajax/categories.php`.

## [2.0.1] - 2025-09-19
- Versão inicial publicada (GLPI 10).
