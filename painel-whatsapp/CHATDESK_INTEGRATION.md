# ChatDesk Integration

Esta documentação descreve a integração da plataforma ChatDesk no Painel WhatsApp.

## 📋 Funcionalidades Implementadas

### 1. Novo Item no Sidebar
- **Ícone**: FaComments
- **Nome**: ChatDesk
- **Localização**: `/chatdesk`

### 2. Página Principal do ChatDesk (`/chatdesk`)
- **Resumo da plataforma** com informações sobre o ChatDesk
- **Botão "Acessar Plataforma"**: Abre a URL da plataforma em nova aba
- **Botão "Ver Relatórios"**: Navega para a página de relatórios
- **Seção de features** destacando funcionalidades principais
- **Seção de contato** para suporte

### 3. Página de Relatórios (`/chatdesk/reports`)
- **Verificação de acesso**: Valida se o email do usuário tem acesso
- **Filtros de relatório**: Período, status, datas específicas
- **Métricas visuais**: Cards com estatísticas principais
- **Tabela detalhada**: Lista de conversas com performance
- **Download Excel**: Exportação de dados
- **Tratamento de erros**: Mensagens específicas para problemas de acesso

## 🔧 Configuração

### Variáveis de Ambiente (.env)
```env
# ChatDesk Configuration
VITE_CHATDESK_URL=https://chatdesk.synergyrpa.com/
VITE_CHATDESK_API_URL=http://localhost:8000/api/v1/report
VITE_CHATDESK_API_TOKEN=your-secret-token-here
```

### Configuração da API
A integração utiliza a API de relatórios baseada na documentação fornecida:

- **Base URL**: Configurável via `VITE_CHATDESK_API_URL`
- **Autenticação**: Bearer token via `VITE_CHATDESK_API_TOKEN`
- **Endpoints utilizados**:
  - `POST /agent/account` - Verificar acesso por email
  - `POST /json` - Relatório em JSON
  - `POST /excel` - Download Excel

## 📊 Fluxo de Funcionamento

### 1. Acesso via Sidebar
1. Usuário clica em "ChatDesk" no sidebar
2. Redirecionamento para `/chatdesk`
3. Exibição da página principal com informações da plataforma

### 2. Acesso à Plataforma Externa
1. Usuário clica em "Acessar Plataforma"
2. Abertura da URL configurada em `VITE_CHATDESK_URL` em nova aba

### 3. Acesso aos Relatórios
1. Usuário clica em "Ver Relatórios"
2. Redirecionamento para `/chatdesk/reports`
3. **Verificação de acesso**:
   - Busca `account_id` pelo email do usuário logado
   - Se encontrado: Carrega relatórios
   - Se não encontrado: Exibe tela de "sem acesso"

### 4. Visualização de Relatórios
1. **Com acesso**: Interface completa com filtros e dados
2. **Sem acesso**: Tela de contato para solicitar acesso

## 🎨 Interface e Design

### Página Principal (/chatdesk)
- **Header**: Logo e título do ChatDesk
- **Grid de features**: 4 cards destacando funcionalidades
- **Seção principal**: Informações detalhadas e botões de ação
- **Rodapé**: Informações de contato para suporte

### Página de Relatórios (/chatdesk/reports)
#### Com Acesso:
- **Header**: Título e informações da conta
- **Filtros**: Período, datas, status
- **Métricas**: 4 cards com estatísticas principais
- **Tabela**: Lista detalhada de conversas
- **Botões**: Download Excel e voltar

#### Sem Acesso:
- **Ícone de alerta**: Indicação visual de restrição
- **Mensagem clara**: Explicação sobre falta de acesso
- **Botões de contato**: Email e WhatsApp para suporte
- **Botão de retorno**: Voltar ao ChatDesk principal

## 🔒 Controle de Acesso

### Verificação por Email
```javascript
// Busca informações da conta pelo email do usuário
const accountData = await api.getAccountByAgentEmail(userEmail);

// Estrutura de resposta esperada:
{
  "account_id": 1,
  "agent_name": "Nome do Agente",
  "account_name": "Nome da Conta"
}
```

### Tratamento de Erros
- **401/403**: Token inválido
- **404**: Usuário não encontrado
- **500**: Erro do servidor
- **Network**: Problemas de conectividade

## 📱 Responsividade

Todas as páginas são responsivas e adaptam-se a diferentes tamanhos de tela:

- **Desktop**: Layout em grid com sidebar
- **Tablet**: Ajuste de colunas e espaçamento
- **Mobile**: Layout vertical com navigation stack

## 🔗 Estrutura de Arquivos

```
src/
├── pages/
│   ├── ChatDesk.jsx           # Página principal
│   └── ChatDeskReports.jsx    # Página de relatórios
├── components/
│   └── Sidebar.jsx            # Atualizado com novo item
├── App.jsx                    # Rotas adicionadas
└── .env                       # Variáveis de configuração
```

## 🧪 Como Testar

### 1. Teste de Navegação
```bash
# Navegar para o ChatDesk
http://localhost:5173/chatdesk

# Navegar para relatórios
http://localhost:5173/chatdesk/reports
```

### 2. Teste de Acesso
- **Com acesso**: Configurar email existente na API
- **Sem acesso**: Usar email não cadastrado na API

### 3. Teste de API
```bash
# Verificar se a API está rodando
curl -X POST "http://localhost:8000/api/v1/report/agent/account" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-secret-token-here" \
  -d '{"agent_email": "test@example.com"}'
```

## 🐛 Troubleshooting

### Problema: "Não tem acesso aos relatórios"
- **Causa**: Email não cadastrado na API
- **Solução**: Verificar se o email existe na base de dados

### Problema: "Erro de autenticação"
- **Causa**: Token inválido ou não configurado
- **Solução**: Verificar `VITE_CHATDESK_API_TOKEN` no .env

### Problema: "API não responde"
- **Causa**: Servidor da API fora do ar
- **Solução**: Verificar se `VITE_CHATDESK_API_URL` está correto

## 📞 Contatos de Suporte

Para problemas de acesso ou configuração:

- **Email**: suporte@synergyrpa.com
- **WhatsApp**: +55 11 99999-9999
- **Assunto**: "Solicitação de Acesso - ChatDesk Relatórios"

## 🔄 Próximas Melhorias

1. **Cache de relatórios** para melhorar performance
2. **Filtros avançados** (inbox, agente específico)
3. **Exportação em PDF** além do Excel
4. **Gráficos interativos** para visualização de dados
5. **Notificações push** para novos relatórios
