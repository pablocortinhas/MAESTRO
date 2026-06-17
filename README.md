# Maestro — Análise de Desempenho · Clube de Regatas do Flamengo

Ferramenta de análise tática em tempo real para registro de ações, heatmap e estatísticas de partidas do Flamengo. Compatível com **Windows 10/11**, **macOS** e **Linux**.

---

## Índice

1. [O que é o Maestro](#o-que-é-o-rubromap)
2. [Pré-requisitos](#pré-requisitos)
3. [Instalação](#instalação)
4. [Como usar](#como-usar)
5. [Gerar instalador](#gerar-instalador)
6. [Dúvidas frequentes](#dúvidas-frequentes)

---

## O que é o Maestro

O Maestro é um aplicativo desktop para comissões técnicas registrarem eventos de partida em tempo real:

- **Ao Vivo** — selecione o jogador, toque na zona do campo e registre a ação (passe, chute, falta, etc.)
- **Heatmap** — visualize onde as ações aconteceram no campo por jogador ou tipo de evento
- **Estatísticas** — totais individuais e coletivos por ação e por zona
- **Posse de bola** — cronômetro automático com percentual Flamengo × adversário
- **Placar e cronômetro** — controle completo do tempo e resultado da partida
- **Elenco** — categorias de Sub-08 ao Profissional e Feminino

---

## Pré-requisitos

Você precisa instalar apenas o **Node.js** (versão 18 ou superior). Ele já inclui o `npm` que usaremos para tudo.

### Windows 10 / 11

1. Acesse [https://nodejs.org](https://nodejs.org)
2. Clique em **"LTS — Recommended for most users"** e baixe o instalador `.msi`
3. Execute o instalador e clique em **Next** até finalizar (mantenha todas as opções padrão)
4. Abra o **Prompt de Comando** (`Win + R` → digite `cmd` → Enter) e confirme:
   ```
   node --version
   npm --version
   ```
   Se aparecerem números de versão, está pronto.

### macOS

**Opção A — Instalador oficial (mais fácil):**
1. Acesse [https://nodejs.org](https://nodejs.org) e baixe o `.pkg` LTS
2. Execute o instalador normalmente
3. Abra o **Terminal** e confirme:
   ```
   node --version
   npm --version
   ```

**Opção B — Homebrew:**
```bash
brew install node
```

### Linux (Ubuntu / Debian)

```bash
sudo apt update
sudo apt install nodejs npm -y
node --version
npm --version
```

Para outras distribuições (Fedora, Arch, etc.) consulte [https://nodejs.org/en/download/package-manager](https://nodejs.org/en/download/package-manager).

---

## Instalação

### Passo 1 — Baixar o projeto

**Opção A — com Git (recomendado):**
```bash
git clone https://github.com/pablocortinhas/MAESTRO.git
cd MAESTRO
```

**Opção B — sem Git:**
1. Na página do repositório no GitHub, clique em **Code → Download ZIP**
2. Extraia o ZIP em uma pasta de sua escolha
3. Abra o terminal dentro dessa pasta

### Passo 2 — Instalar as dependências

Execute **uma única vez** após baixar:

```bash
npm install
```

Isso instala automaticamente React, Electron e todas as bibliotecas necessárias. Pode demorar alguns minutos na primeira vez.

---

## Como usar

### Modo desenvolvimento (para testar/usar diariamente)

```bash
npm run dev
```

Isso abre o app no **Electron** (janela desktop) com recarregamento automático ao editar arquivos.

> No Windows, caso apareça um aviso de Firewall, clique em **Permitir acesso**.

### Modo produção

```bash
npm start
```

Compila o app e abre a versão otimizada no Electron.

---

## Guia rápido de uso

### Tela Ao Vivo

1. **Selecione a categoria** (Sub-13, Profissional, etc.) no topo
2. **Selecione o jogador** na lista lateral
3. **Toque na zona do campo** onde a ação ocorreu
4. **Clique no botão da ação** (Passe Certo, Chute, Falta, etc.)
5. A ação é registrada e o campo pisca confirmando

**Placar e cronômetro:** use os botões `▶` / `⏸` para controlar o tempo; toque no placar para alterar o score.

**Posse de bola:** ative o modo de posse para cronometrar automaticamente o tempo com e sem a bola.

### Heatmap

- Escolha um jogador ou "Time completo" no filtro
- O mapa de calor mostra a intensidade de ações por zona do campo
- Use o filtro de ação para ver apenas chutes, passes, etc.

### Estatísticas

- Tabela completa de cada jogador com totais por categoria de ação
- Clique em um jogador para ver o detalhamento por zona

### Elenco

- Visualize e gerencie os jogadores de cada categoria
- Filtre por posição

---

## Transferir configuração de botões entre PCs

A disposição, cores e atalhos dos botões de **Ações** ficam salvos localmente no aparelho. Para usar a mesma configuração em outro PC:

**No PC de origem:**
1. Abra o app → aba **ANÁLISE** → painel **AÇÕES** → clique **EDITAR**
2. Clique em **EXPORTAR** → salva o arquivo `rubromap-acoes.json`
3. Copie esse arquivo para o outro PC (pendrive, e-mail, Google Drive, etc.)

**No PC de destino:**
1. Clone o repositório e execute `npm install && npm start`
2. Abra o app → aba **ANÁLISE** → painel **AÇÕES** → clique **EDITAR**
3. Clique em **IMPORTAR** e selecione o arquivo `rubromap-acoes.json`

O botão **PADRÃO** (verde, em modo EDITAR) salva a configuração atual como padrão local — ela será restaurada mesmo se o app for reinstalado no mesmo PC.

---

## Gerar instalador

Para distribuir o app como executável instalável:

### Windows (.exe installer)
```bash
npm run dist:win
```
O instalador será gerado em `out/Maestro Setup x.x.x.exe`.

### macOS (.dmg)
```bash
npm run dist:mac
```
O arquivo `.dmg` será gerado em `out/`.

> Requer macOS para gerar o `.dmg`. Em Windows/Linux você pode gerar somente para a plataforma atual.

### Linux (.AppImage)
```bash
npm run dist:linux
```
O arquivo `.AppImage` será gerado em `out/`. Para executar:
```bash
chmod +x Maestro-*.AppImage
./Maestro-*.AppImage
```

---

## Dúvidas frequentes

**"npm: command not found"**
→ O Node.js não foi instalado corretamente. Reinstale seguindo os passos acima e reinicie o terminal.

**"electron: command not found" ou "Cannot find module"**
→ As dependências não foram instaladas. Execute `npm install` dentro da pasta do projeto.

**A janela abre em branco**
→ Aguarde alguns segundos; na primeira execução o Vite precisa compilar os arquivos. Se persistir, execute `npm run build` e depois `npm start`.

**Como desfazer a última ação registrada?**
→ No modo Ao Vivo, use o botão **Desfazer** (↩) na barra superior.

**Os dados são salvos automaticamente?**
→ As configurações de cores dos botões são salvas automaticamente no navegador local. Os dados de partida ficam em memória — ao fechar o app os dados são perdidos. Exporte as estatísticas antes de encerrar.

---

## Tecnologias utilizadas

| Tecnologia | Versão |
|---|---|
| React | 18 |
| Vite | 5 |
| Electron | 26 |
| electron-builder | 24 |

---

*Maestro — desenvolvido para o Clube de Regatas do Flamengo*
