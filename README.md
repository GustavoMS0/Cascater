# Cascater
Plugin Cascater para GLPI


Cascater é um plugin de código aberto para o GLPI que resolve um dos maiores desafios de usabilidade em sistemas de ITSM: a seleção de categorias de chamados. Ele transforma a lista de categorias única e interminável do GLPI numa série de menus suspensos dinâmicos e em cascata, tornando o processo de classificação de chamados mais rápido, intuitivo e à prova de erros.

O Problema que o Cascater Resolve
Em ambientes GLPI com uma árvore de categorias complexa, os utilizadores e técnicos enfrentam uma lista única com dezenas ou centenas de opções. Isto leva a:

Perda de tempo: Procurar a categoria correta é demorado.

Erros de Classificação: É fácil selecionar a categoria errada, o que prejudica a triagem e as métricas do helpdesk.

Frustração do Utilizador: Uma má experiência de utilizador pode diminuir a adoção da ferramenta.

Antes do Cascater:
A Solução com o Cascater
O Cascater substitui a lista única por uma abordagem em cascata. Ao selecionar uma categoria principal, um novo menu aparece apenas com as subcategorias relevantes, guiando o utilizador de forma lógica até à sua escolha final.

Com o Cascater:
Funcionalidades Principais
Seleção em Cascata: Navegue por árvores de categorias complexas de forma simples e rápida.

Filtro Inteligente: As subcategorias são filtradas automaticamente com base no tipo de chamado (Incidente/Requisição) a partir do segundo nível.

Compatibilidade Total: Funciona tanto na criação de novos chamados como na edição de chamados existentes, carregando e pré-selecionando a árvore de categorias correta.

Integração Nativa: Totalmente integrado com a interface do GLPI, funcionando tanto no modo padrão (para técnicos) como no simplificado (helpdesk.public.php).

Instalação
Aceda à secção de "Releases" deste repositório.

Descarregue o ficheiro .zip da versão mais recente.

Descomprima o ficheiro na pasta plugins/ da sua instalação do GLPI. A estrutura final deve ser glpi/plugins/Cascater/.

No GLPI, aceda a Configurar > Plugins, e depois clique em "Instalar" e "Ativar" no plugin Cascater.

Como Usar
Após a instalação, o plugin irá substituir automaticamente o campo de categoria padrão nos formulários de criação e edição de chamados. Não é necessária qualquer configuração adicional.

Licença
Este plugin é distribuído sob a licença GNU General Public License v3.0. Veja o ficheiro LICENSE para mais detalhes.
