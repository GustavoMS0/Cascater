# Cascater

> **Plugin para o [GLPI](https://glpi-project.org/)** (PHP + JavaScript), compatível com o **GLPI 10.0.x e 11.0.x** (PHP 8.x). Instale-o na pasta `plugins/` do GLPI; ele não funciona sozinho.

**Seleção de categorias em cascata para o GLPI.** Em vez de uma lista única e enorme de categorias, o Cascater mostra um menu por nível: você escolhe a categoria principal, aparece o menu das subcategorias dela, e assim por diante.

```
Antes:  [ Hardware > Impressoras > Atolamento de papel          ▼ ]   ← lista com centenas de itens

Depois: [ Hardware            ▼ ]
        [ Impressoras         ▼ ]
        [ Atolamento de papel ▼ ]
```

| Versão do GLPI | Suporte |
|---|---|
| **11.0.x** | ✅ |
| **10.0.x** | ✅ |

---

## Funcionalidades

- **Menus em cascata** para qualquer profundidade de categorias.
- **Respeita as mesmas regras do campo nativo do GLPI:**
  - entidades do usuário e da entidade do chamado (inclusive categorias recursivas);
  - opção **"Visível na interface simplificada"** para usuários do autoatendimento;
  - opções **"Visível para incidentes / requisições"** conforme o tipo do chamado.
- **Funciona com modelos de chamado:** ao escolher a categoria final em um chamado novo, o GLPI recarrega o formulário e aplica o modelo da categoria (campos obrigatórios e pré-definidos), como no campo nativo.
- **Edição de chamados:** abre com o caminho da categoria atual já selecionado.
- **Troca de tipo** (incidente ou requisição): os menus são refeitos com as categorias válidas para o novo tipo.
- **Rápido:** a árvore é carregada uma única vez por formulário; navegar entre os níveis não faz novas requisições.
- **Acessível:** cada menu tem um nome para leitores de tela (o rótulo do campo e o nível) e o rótulo do campo aponta para o primeiro menu.
- **Traduzível:** os textos da interface vêm do GLPI, pelo domínio de tradução `Cascater` (veja `locales/`).
- **Seguro:** só usuários autenticados acessam as categorias, e o campo original continua sendo o que é enviado ao GLPI.
- **Não altera o banco de dados:** instalar ou remover o plugin não cria nem apaga nada.

### Onde o plugin atua

| Tela | GLPI 10 | GLPI 11 |
|---|---|---|
| Formulário do chamado (criação e edição, interface padrão) | ✅ | ✅ |
| Abertura de chamado na interface simplificada (autoatendimento) | ✅ | — ¹ |
| Problemas, Mudanças e demais telas | Não altera | Não altera |

¹ No GLPI 11, o autoatendimento abre chamados pelo novo módulo **Formulários**, e não mais pelo formulário de chamado. Nos Formulários, a própria pergunta de categoria permite limitar a árvore a partir de uma categoria raiz e com profundidade máxima.

---

## Instalação

1. Baixe o arquivo **`cascater-x.y.z.zip`** da [última Release](https://github.com/GustavoMS0/Cascater/releases/latest).
2. Extraia o conteúdo na pasta de plugins do GLPI. A estrutura deve ficar assim:
   ```
   glpi/plugins/Cascater/setup.php
   ```
   > O nome da pasta precisa ser exatamente **`Cascater`**.
3. No GLPI, acesse **Configurar › Plugins** e clique em **Instalar** e depois em **Ativar** no Cascater.

Pronto. Não há nada para configurar: o campo de categoria dos chamados passa a funcionar em cascata.

### Instalação pelo terminal (servidor Linux)

```bash
cd /var/www/glpi/plugins            # ajuste para o caminho do seu GLPI
VERSAO=$(curl -fsSL https://api.github.com/repos/GustavoMS0/Cascater/releases/latest | grep -oP '"tag_name": "v\K[^"]+')
curl -fsSL -o cascater.zip "https://github.com/GustavoMS0/Cascater/releases/download/v$VERSAO/cascater-$VERSAO.zip"
unzip -o cascater.zip && rm cascater.zip
chown -R root:root Cascater

# Instala e ativa sem abrir o navegador
sudo -u www-data php ../bin/console plugin:install --username=glpi Cascater
sudo -u www-data php ../bin/console plugin:activate Cascater
```

### Atualizando da versão 2.x

A versão 3 mudou a estrutura de pastas. **Apague a pasta antiga antes de copiar a nova**, para não sobrarem arquivos da versão anterior:

```bash
rm -rf /var/www/glpi/plugins/Cascater
# depois siga os passos de instalação acima
```

Depois de copiar, o GLPI mostra o plugin como "a atualizar". Clique em **Instalar** e em **Ativar** novamente.

---

## Como funciona

1. Ao abrir um chamado, o plugin busca de uma vez a árvore de categorias permitidas para o usuário, a entidade e o tipo do chamado.
2. O campo de categoria original fica **oculto, mas continua no formulário**. Cada escolha nos menus atualiza esse campo. Por isso validações, campos obrigatórios e modelos de chamado continuam funcionando.
3. Uma categoria que **não vale para o tipo do chamado**, mas tem subcategorias válidas, aparece em *itálico*. Ela serve só para navegar até as subcategorias.
4. Se o plugin não conseguir carregar as categorias, por qualquer motivo, o campo nativo do GLPI aparece normalmente. O chamado nunca fica sem campo de categoria.

---

## Solução de problemas

| Sintoma | O que verificar |
|---|---|
| O campo continua com a lista única | Confira se o plugin está **Ativado** em Configurar › Plugins e limpe o cache do navegador (Ctrl+F5) |
| Alguma categoria não aparece | Confira, na categoria, a **entidade**, a opção **"Visível na interface simplificada"** (para usuários do autoatendimento) e **"Visível para incidentes / requisições"** |
| Erro `404` para `cascater.js` no console do navegador | O nome da pasta precisa ser exatamente `Cascater`, com a estrutura `plugins/Cascater/public/js/cascater.js` |
| Mensagem `Cascater: falha ao carregar categorias` no console | Abra `/plugins/Cascater/ajax/categories.php` logado no GLPI; a resposta deve ser um JSON com a lista de categorias (`categories`). Veja também o log de erros do PHP |

---

## Desenvolvimento

```
Cascater/
├── setup.php               Registro do plugin e dos hooks (GLPI 10 e 11)
├── ajax/categories.php     Endpoint JSON com a árvore de categorias filtrada
├── locales/Cascater.pot    Modelo de tradução (domínio "Cascater"; textos-fonte em português)
└── public/
    ├── js/cascater.js      Interface em cascata
    └── css/cascater.css
```

Para publicar uma nova versão, atualize `PLUGIN_CASCATER_VERSION` em `setup.php` e o [CHANGELOG](CHANGELOG.md) e crie a tag:

```bash
git tag v3.0.0
git push origin v3.0.0
```

O GitHub Actions gera o arquivo `cascater-3.0.0.zip` e publica a Release automaticamente.

---

## Licença

Distribuído sob a licença **GNU General Public License v3.0 ou posterior**. Veja o arquivo [LICENSE](LICENSE).
