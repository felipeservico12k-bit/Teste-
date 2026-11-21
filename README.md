# Medidor de Dedo

Aplicativo web que descobre o **tamanho do dedo e o número do anel** usando a tela do celular ou do computador. Não precisa instalar nada: é só abrir no navegador.

## Como funciona

1. **Calibrar:** você encosta um cartão de tamanho padrão (crédito, débito, transporte) na tela e ajusta o retângulo até ficar do mesmo tamanho. Com isso o app descobre quantos pixels a sua tela tem por milímetro. A calibração fica salva no navegador.
2. **Medir**, de um destes jeitos:
   - **Com um anel que já serve:** coloque o anel sobre o círculo e ajuste até a linha encostar na parte de dentro.
   - **Com uma tira de papel ou barbante:** enrole no dedo, marque, meça na régua da tela (ou numa régua de verdade) e digite o comprimento em milímetros.
3. O app mostra o **aro brasileiro**, a circunferência, o diâmetro e os tamanhos **EUA** e **Europa (ISO)**.

## Conversões usadas

| Medida | Fórmula |
| --- | --- |
| Aro (Brasil) | circunferência interna em mm − 40 (ex.: 56 mm → aro 16) |
| Europa (ISO 8653) | circunferência interna em mm |
| EUA | (diâmetro em mm − 11,63) ÷ 0,8128, arredondado para meio número |

As tabelas variam um pouco entre joalherias, então vale confirmar com a loja.

## Rodando

São só três arquivos estáticos (`index.html`, `styles.css`, `app.js`). Para testar, abra o `index.html` no navegador.

Para usar no celular, dá para publicar de graça pelo **GitHub Pages**: no repositório, vá em *Settings → Pages*, escolha a branch e a pasta raiz (`/`), e o GitHub gera um link.
