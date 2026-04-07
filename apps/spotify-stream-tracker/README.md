# Spotify Stream Tracker 🎵

Ferramenta simples para monitoramento diário de streams do Spotify, sem uso de API oficial.

## Instalação
1. Certifique-se de ter o Node.js instalado.
2. Instale as dependências:
   ```bash
   npm install
   ```

## Configuração
Edite o arquivo `tracks.csv` com as músicas que deseja monitorar, seguindo o formato:
```csv
track_id,spotify_url
ID_DA_MUSICA,https://open.spotify.com/track/LINK_DA_MUSICA
```

## Uso
1. Execute o script:
   ```bash
   node scrape.js
   ```
2. Na primeira execução, uma janela do navegador abrirá. **Faça login na sua conta do Spotify manualmente.**
3. Volte ao terminal e pressione **ENTER**.
4. O script navegará por cada link e salvará os streams no banco de dados `db.sqlite`.

## Uso com Google Sheets (Opcional)
Para espelhar os dados em uma planilha do Google:

1. **Configuração Google:**
   - Crie um projeto no Google Cloud Console e ative a **Google Sheets API**.
   - Crie uma Service Account e baixe o JSON da chave.
   - Renomeie o arquivo para `google-creds.json` e coloque nesta pasta.

2. **Planilha:**
   - Crie uma nova planilha no Google Sheets.
   - Crie uma aba chamada `streams_daily`.
   - Na linha 1, crie o cabeçalho: `date | track_url | total_streams`.
   - Compartilhe a planilha (Editor) com o email da sua Service Account.
   - Copie o ID da planilha (está na URL).

3. **Configuração Script:**
   - Abra o `scrape.js`.
   - Edite a constante `SPREADSHEET_ID` com o ID da sua planilha.

## Automação Diária (macOS)
Para rodar a exportação automaticamente todo dia às 09:05:

1. **Instalar Agente Launchd:**
   - O arquivo de configuração já foi criado em: `com.daniel.streams.export.plist`.
   - Copie para a pasta de agentes do usuário e carregue:
     ```bash
     cp com.daniel.streams.export.plist ~/Library/LaunchAgents/
     launchctl load -w ~/Library/LaunchAgents/com.daniel.streams.export.plist
     ```

2. **Testar Automação:**
   - Inicie manualmente para testar:
     ```bash
     launchctl start com.daniel.streams.export
     ```
   - Verifique os logs na pasta `logs/`.

3. **Desativar:**
   - Se quiser parar:
     ```bash
     launchctl unload -w ~/Library/LaunchAgents/com.daniel.streams.export.plist
     ```

## Dados
Os dados são salvos em:
1. **SQLite (`db.sqlite`)**: Tabela `streams_total` (Fonte da verdade).
2. **Google Sheets**: Aba `streams_daily` (Espelho para visualização).
