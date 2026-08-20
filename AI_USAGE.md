# Uso de IA no desenvolvimento

## Ferramentas utilizadas

- ChatGPT
- Antigravity
- Modelos LLM utilizados pelo ecossistema do Antigravity

## Como a IA foi utilizada

O desenvolvimento deste desafio adotou ferramentas de IA de forma iterativa e assistida para:
- discussão de arquitetura e validação de abordagens;
- decomposição do desafio em fases de engenharia menores e testáveis;
- revisão de código e sugestão de padrões (como o uso do Zod para schemas e do padrão BFF para a TMDb);
- geração inicial de algumas implementações que posteriormente foram revisadas e ajustadas;
- preparação de cenários de teste manuais focados na concorrência do banco de dados;
- auditoria de aderência aos requisitos do desafio.

## Decisões técnicas discutidas/revisadas

As seguintes implementações contaram com discussões diretas junto à IA para pesar alternativas:

- **Concorrência na reserva de assentos:** Debate sobre como utilizar atualizações condicionais (`updateMany`) e transações no Prisma para impedir reserva concorrente do mesmo recurso.
- **Estoque GENERAL_ADMISSION:** Lógica de decréscimo atômico de ingressos de pista limitando rigorosamente o quantitativo.
- **Integração TMDb pelo backend:** Definição da arquitetura BFF (Backend for Frontend) para garantir que a chave da TMDb nunca fosse enviada ao navegador do cliente.
- **HMAC do ingresso:** Implementação da geração segura do código e assinatura criptográfica enviada no QR Code, usando validação protegida via `timingSafeEqual`.
- **Compartilhamento com shareToken:** Decisão de não usar IDs internos publicamente, adotando um token aleatório para visualização que mantém intacta a regra de consumo único.
- **Validação QR e manual:** Separação dos fluxos de entrada na portaria: o scanner lê o payload do QR e o backend valida sua assinatura HMAC, enquanto a validação manual consulta pelo código do ingresso (`ticketCode`).
- **Migrations e reprodutibilidade:** Detecção de ausência de versionamento no banco local e estruturação final das migrations versionadas para assegurar reprodutibilidade de novos clones do repositório.

## O que não foi delegado cegamente

As ferramentas foram utilizadas para propor implementações e discutir decisões, mas as alterações foram executadas incrementalmente, compiladas, testadas e revisadas. Foram mantidas as seguintes práticas:
- As propostas de arquitetura e modelagem do banco foram lidas criticamente e validadas contra as restrições de escopo.
- Builds do backend e frontend, análises estáticas (lint) e execuções manuais de validação (smoke tests) foram disparadas sistematicamente.
- As abordagens propostas foram revisadas e ajustadas repetidas vezes quando não atendiam plenamente à segurança, à concorrência assíncrona ou aos contratos das APIs desenhadas para a solução.

## Exemplos de correções realizadas após revisão

Durante o desenvolvimento, algumas implementações iniciais geradas com auxílio da IA precisaram de correções após testes e auditorias:

- **Identificação do bug de evento SEATED sem assentos:** A implementação inicial para criar eventos numerados retornava HTTP 201, mas omitia a criação das entidades dos assentos no banco. Durante a revisão, o problema foi identificado e ajustado para incluir a geração física atrelada à capacidade (`totalCapacity`).
- **Correção da geração após fileira Z:** O algoritmo inicial para colunas/fileiras reiniciava os códigos indevidamente em capacidades altas. Após validações e testes manuais com capacidades superiores a 260 assentos, a lógica foi corrigida para suportar a série contínua (AA, AB, AC).
- **Distinção entre validação QR e manual:** Houve uma proposta inicial de mesclar a validação baseada em hash com a digitação manual do porteiro na mesma rota. Para manter a integridade, decidiu-se separar os dois contratos em rotas isoladas.
- **Identificação da migration ausente:** Foi identificado que o desenvolvimento local estava progredindo utilizando o comando `db push`, o que resultou na ausência da migration SQL correspondente ao campo `shareToken`. O fluxo foi ajustado para gerar a migration e garantir a instalação por meio do comando `migrate deploy`.

## Limitações
 
O uso de ferramentas de IA exige revisão técnica das respostas geradas:
- Modelos generativos podem produzir afirmações imprecisas ou sugerir códigos parciais como soluções definitivas, exigindo validação técnica contínua.
- Implementações de banco de dados podem parecer funcionais em cenários simples, mas frequentemente requerem revisões rigorosas (como o uso de atualizações condicionais) para tratar alta concorrência adequadamente.
- Relatórios automatizados podem confundir a execução de scripts imperativos isolados (smoke tests) com suítes de testes automatizados reais. Os artefatos foram revisados para descrever com precisão que o projeto utiliza builds, lint e testes manuais de negócio, sem integração formal de suíte no comando `npm test`.

Todas as saídas foram progressivamente revisadas, documentadas e ajustadas contra o repositório em disco e o descritivo de avaliação.
