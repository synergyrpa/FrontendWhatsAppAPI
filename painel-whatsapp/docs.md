# API WhatsApp V2 – Documentação Completa de Endpoints

Esta documentação detalha todas as rotas da API WhatsApp V2, incluindo autenticação JWT/OTP, envio de mensagens, gerenciamento de usuários, números e relatórios.

## Autenticação
- **Header obrigatório:** `Authorization: Bearer <JWT>` (para rotas protegidas)
- **Token estático:** `Token: <api_token>` (header para compatibilidade)
- O JWT é obtido via fluxo OTP (consulte seção de autenticação).

---

## 1. Autenticação (JWT/OTP)

### 1.1. Solicitar OTP
`POST /v2/auth/otp/request`

**Body JSON:**
- `otp_type` (string, opcional): "login" ou "register" (padrão: "login")
- `otp_for` (string, opcional): "email" ou "number" (padrão: "email")
- `email` (string, obrigatório se otp_for=email): Email do usuário
- `number` (string, obrigatório se otp_for=number): Número do usuário

**Exemplo para email:**
```bash
curl -X POST https://SEU_HOST/api/v2/auth/otp/request \
  -H "Content-Type: application/json" \
  -d '{
    "otp_type": "login",
    "otp_for": "email",
    "email": "usuario@exemplo.com"
  }'
```

**Exemplo para número:**
```bash
curl -X POST https://SEU_HOST/api/v2/auth/otp/request \
  -H "Content-Type: application/json" \
  -d '{
    "otp_type": "login",
    "otp_for": "number",
    "number": "5511999999999"
  }'
```

### 1.2. Validar OTP e obter JWT
`POST /v2/auth/otp/validate`

**Body JSON:**
- `otp_type` (string, opcional): "login" ou "register" (padrão: "login")
- `otp_for` (string, opcional): "email" ou "number" (padrão: "email")
- `email` (string, obrigatório se otp_for=email): Email do usuário
- `number` (string, obrigatório se otp_for=number): Número do usuário
- `email_otp_code` (string, obrigatório se otp_for=email): Código OTP recebido no email
- `number_otp_code` (string, obrigatório se otp_for=number): Código OTP recebido no número

**Exemplo para email:**
```bash
curl -X POST https://SEU_HOST/api/v2/auth/otp/validate \
  -H "Content-Type: application/json" \
  -d '{
    "otp_type": "login",
    "otp_for": "email",
    "email": "usuario@exemplo.com",
    "email_otp_code": "123456"
  }'
```

**Resposta de sucesso:**
```json
{
  "success": true,
  "message": "Código OTP validado com sucesso.",
  "token": "<jwt_token>",
  "expires_in": 86400
}
```

---

## 2. Envio de Mensagens

### 2.1. Enviar mídia/texto via JSON
`POST /v2/sends`

**Headers:**
- `Authorization: Bearer <JWT>`

**Body JSON:**
- `from_number` (string, obrigatório): Número do remetente (deve ser worker do usuário)
- `to_number` (string, obrigatório): Número do destinatário
- `media_type` (string, obrigatório): 'text', 'image', 'audio', 'document', 'video'
- `media_url` (string, obrigatório para mídia): URL do arquivo
- `content` (string, obrigatório para texto): Texto da mensagem
- `caption` (string, opcional): Legenda para mídia

**Exemplo de envio de texto:**
```bash
curl -X POST https://SEU_HOST/api/v2/sends \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{
    "from_number": "5511999999999",
    "to_number": "5511888888888",
    "media_type": "text",
    "content": "Olá, mundo!"
  }'
```

**Exemplo de envio de imagem:**
```bash
curl -X POST https://SEU_HOST/api/v2/sends \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{
    "from_number": "5511999999999",
    "to_number": "5511888888888",
    "media_type": "image",
    "media_url": "https://exemplo.com/imagem.jpg",
    "caption": "Legenda opcional"
  }'
```

### 2.2. Enviar mídia via multipart/form-data
`POST /v2/upload/sends`

**Headers:**
- `Authorization: Bearer <JWT>` ou `Token: <api_token>`

**Form Data:**
- `from_number` (string, obrigatório): Número do remetente
- `to_number` (string, obrigatório): Número do destinatário
- `media_type` (string, obrigatório): 'image', 'audio', 'document', 'video'
- `file` (arquivo, obrigatório): Arquivo de mídia para upload
- `caption` (string, opcional): Legenda para a mídia

**Exemplo:**
```bash
curl -X POST https://SEU_HOST/api/v2/upload/sends \
  -H "Authorization: Bearer <JWT>" \
  -F 'from_number=5511999999999' \
  -F 'to_number=5511888888888' \
  -F 'media_type=image' \
  -F 'file=@/caminho/para/imagem.jpg' \
  -F 'caption=Legenda opcional'
```

---

## 3. Gerenciamento de Usuários

### 3.1. Registrar usuário
`POST /v2/users/register`

**Headers:**
- `api-token: <token>`

**Body JSON:**
- `login` (string, obrigatório): Login do usuário
- `number` (string, obrigatório): Número do usuário
- `password` (string, opcional): Senha do usuário
- `plan` (string, obrigatório): Plano do usuário

**Exemplo:**
```bash
curl -X POST https://SEU_HOST/api/v2/users/register \
  -H "api-token: <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "login": "usuario",
    "number": "5511999999999",
    "password": "senha123",
    "plan": "premium"
  }'
```

### 3.2. Login de usuário
`POST /v2/users/login`

**Body JSON:**
- `login` (string, obrigatório): Login do usuário
- `password` (string, obrigatório): Senha do usuário

**Exemplo:**
```bash
curl -X POST https://SEU_HOST/api/v2/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "login": "usuario",
    "password": "senha123"
  }'
```

### 3.3. Remover usuário
`POST /v2/users/remove`

**Headers:**
- `token: <token>`

**Body JSON:**
- `login` (string, obrigatório): Login do usuário
- `password` (string, obrigatório): Senha do usuário

**Exemplo:**
```bash
curl -X POST https://SEU_HOST/api/v2/users/remove \
  -H "token: <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "login": "usuario",
    "password": "senha123"
  }'
```

---

## 4. Gerenciamento de Números

### 4.1. Listar números
`GET /v2/numbers`

**Headers:**
- `token: <token>`

**Exemplo:**
```bash
curl -X GET https://SEU_HOST/api/v2/numbers \
  -H "token: <TOKEN>"
```

### 4.2. Registrar números
`POST /v2/numbers`

**Headers:**
- `token: <token>`

**Body JSON:**
- `numbers_admins` (array, opcional): Lista de números administradores
- `numbers_workers` (array, opcional): Lista de números workers

**Exemplo:**
```bash
curl -X POST https://SEU_HOST/api/v2/numbers \
  -H "token: <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "numbers_admins": ["5511999999999"],
    "numbers_workers": ["5511888888888", "5511777777777"]
  }'
```

### 4.3. Atualizar números
`PUT /v2/numbers`

**Headers:**
- `token: <token>`

**Body JSON:**
- `numbers_admins` (array, opcional): Lista de números administradores
- `numbers_workers` (array, opcional): Lista de números workers

### 4.4. Remover número
`DELETE /v2/numbers`

**Headers:**
- `token: <token>`

**Body JSON:**
- `number` (string, obrigatório): Número a ser removido
- `role` (string, obrigatório): Papel do número ("admin" ou "worker")

**Exemplo:**
```bash
curl -X DELETE https://SEU_HOST/api/v2/numbers \
  -H "token: <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "number": "5511999999999",
    "role": "worker"
  }'
```

### 4.5. Adicionar número
`POST /v2/numbers/add`

**Headers:**
- `token: <token>`

**Body JSON:**
- `number` (string, obrigatório): Número a ser adicionado
- `role` (string, obrigatório): Papel do número ("admin" ou "worker")

**Exemplo:**
```bash
curl -X POST https://SEU_HOST/api/v2/numbers/add \
  -H "token: <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "number": "5511999999999",
    "role": "worker"
  }'
```

### 4.6. Consultar status do número
`GET /v2/numbers/status?number=<numero>`

**Headers:**
- `token: <token>`

**Query Parameters:**
- `number` (string, obrigatório): Número para consulta de status

**Exemplo:**
```bash
curl -X GET "https://SEU_HOST/api/v2/numbers/status?number=5511999999999" \
  -H "token: <TOKEN>"
```

---

## 5. Relatórios

### 5.1. Relatório de envios
`GET /v2/reports/sends`

**Headers:**
- `Authorization: Bearer <JWT>` ou `token: <token>`

**Query Parameters:**
- `from_number` (string, obrigatório): Número de origem
- `init_time` (string, opcional): Data inicial (DD/MM/YYYY ou DD/MM/YYYY HH:MM:SS)
- `end_time` (string, opcional): Data final (DD/MM/YYYY ou DD/MM/YYYY HH:MM:SS)

**Exemplo:**
```bash
curl -X GET "https://SEU_HOST/api/v2/reports/sends?from_number=5511999999999&init_time=01/01/2024&end_time=31/12/2024" \
  -H "Authorization: Bearer <JWT>"
```

**Resposta de sucesso:**
```json
{
  "success": true,
  "message": "Envios filtrados para o número 5511999999999",
  "description": [
    {
      "send_id": "uuid",
      "to_number": "5511888888888",
      "message": "Mensagem enviada",
      "status": "enviado",
      "date_time_queue": "01/01/2024, 10:30:00"
    }
  ]
}
```

---

## 6. Códigos de Resposta Comuns

### Sucesso (2xx)
- **200**: Operação realizada com sucesso
- **201**: Recurso criado com sucesso

### Erro do Cliente (4xx)
- **400**: Requisição inválida (parâmetros obrigatórios ausentes ou inválidos)
- **401**: Não autenticado (token inválido ou ausente)
- **403**: Acesso negado (worker não autorizado, plano não permite)
- **404**: Recurso não encontrado
- **422**: Erro de validação de dados
- **429**: Muitas tentativas (rate limit excedido)

### Erro do Servidor (5xx)
- **500**: Erro interno do servidor

---

## 7. Observações Gerais

- **Autenticação**: Rotas V2 usam JWT via OTP, com fallback para token estático.
- **Rate Limiting**: Todas as rotas têm limitação de taxa configurável.
- **Envios assíncronos**: Mensagens são enfileiradas (SQS) e processadas em background.
- **Validação de workers**: Apenas números workers do usuário podem enviar mensagens.
- **Validação de planos**: Tipos de mídia permitidos variam conforme o plano do usuário.
- **Retrocompatibilidade**: V1 continua funcionando com `api-token`.

---

## 8. Retrocompatibilidade com V1

As rotas V1 continuam disponíveis para compatibilidade:

**Exemplo V1:**
```bash
curl -X POST https://SEU_HOST/api/v1/send/text \
  -H "Content-Type: application/json" \
  -H "api-token: <TOKEN>" \
  -d '{
    "from_number": "5511999999999",
    "to_number": "5511888888888",
    "message": "Olá!"
  }'
```
