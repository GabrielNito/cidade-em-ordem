# Cidade em Ordem

Protótipo frontend mobile-first para o Hackathon Fatec Indaiatuba 2026. O projeto simula o registro, o atendimento e a gestão de ocorrências de zeladoria urbana sem backend.

A aplicação usa Next.js App Router, React, TypeScript, Tailwind CSS, Leaflet/OpenStreetMap e persistência local para a demonstração.

## Executar localmente

```bash
npm install
npm run dev
```

Checks disponíveis:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Durante o desenvolvimento, `/design-system` abre o design sheet interno com os tokens e padrões visuais compartilhados. Ele não faz parte da navegação do produto.

## Demonstração

1. Abra a aplicação e clique em **Entrar com gov.br**. O acesso é local e simulado.
2. No menu **Perfil**, use **Trocar contexto** para alternar entre Cidadão, Equipe de campo e Gestão.
3. O fluxo principal começa em **Nova ocorrência**. A localização usa a Geolocation API; em ambientes sem permissão, o formulário oferece um ponto de demonstração claramente identificado.
4. A Equipe de campo pode atribuir um responsável, iniciar o atendimento e finalizar a ordem com fotografia do resultado.
5. Gestão apresenta os indicadores, distribuições e o mapa filtrável usando o mesmo conjunto de dados.

## Estrutura principal

- `src/types`: modelo de domínio e status permitidos.
- `src/data`: dados iniciais e equipe mockada.
- `src/services/reportRepository.ts`: persistência e transições via `localStorage`.
- `src/context`: sessão local e estado compartilhado entre os contextos.
- `src/components`: shell responsivo, cartões, mapas, estados e componentes de formulário.
- `app`: rotas e layouts do Next.js, protegidos por papel de demonstração.
- `src/screens`: telas do cidadão, campo, gestão, login e design sheet.
- `src/navigation.tsx`: adapter de navegação que concentra o uso do Next.js.

O mapa usa Leaflet com OpenStreetMap. A autenticação gov.br, os dados, a geolocalização de demonstração e os uploads ainda são locais; a substituição por serviços reais fica para a etapa de backend.
