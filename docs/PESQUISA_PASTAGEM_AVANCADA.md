# Pesquisa Avançada: Manejo Científico de Pastagens — AgroMacro

Este documento consolida as diretrizes técnicas e científicas para a inteligência artificial do AgroMacro (Boteco), baseadas em estudos da EMBRAPA, teses acadêmicas e práticas modernas de pecuária de precisão.

## 1. Equivalência e Capacidade de Suporte (Visão Macro)

### Unidade Animal (UA)
- **Definição Padrão**: 1 UA = 450 kg de peso vivo.
- **Cálculo de Lotação (Geral)**: (Somatório de Pesos de todos os Lotes / 450) / Somatório de Hectares Ativos.

### Metas de Lotação (Referência Brasil)
| Sistema | Período | Capacidade Estimada (UA/ha) |
| :--- | :--- | :--- |
| **Extensivo (Contínuo)** | Ano Todo | 0,3 a 0,8 |
| **Brachiaria (Rotacionado)** | Águas | 1,5 a 4,0 |
| **Brachiaria (Rotacionado)** | Seca | 0,5 a 1,0 |
| **Panicum/Colonião (Intensivo)**| Águas | 4,0 a 8,0 |

## 2. Manejo Rotacionado (A "Regra de Ouro")

O segredo do sistema rotacionado não é a carga alta, mas sim o **Período de Descanso** e a **Altura de Saída**.

### Alturas de Manejo
- **Brachiaria (Decumbens/Brizantha)**: Entrada 30-40cm | Saída 20-25cm.
- **Panicum (Mombaça/Tanzânia)**: Entrada 80-90cm | Saída 40-50cm.

### Tempos de Ciclo
- **Ocupação**: 1 a 7 dias (Máximo 3 dias para alta performance).
- **Descanso (Águas)**: 21 a 35 dias (permitindo reposição de reservas da planta).
- **Descanso (Seca)**: 45 a 90 dias (ou conforme o crescimento).

## 3. Influência Climática (Índice Pluviométrico)

A disponibilidade de massa verde é diretamente proporcional à chuva acumulada e temperatura.
- **Regra de Alerta (< 50mm/30 dias)**: Se a chuva acumulada nos últimos 30 dias for inferior a 50mm, a IA deve alertar para a interrupção do crescimento da forragem e sugerir redução de carga (deslotação) ou suplementação imediata.
- **Transição Águas-Seca**: Sugerir adubação nitrogenada 30-40 dias antes do fim das chuvas para "vedar" o pasto com reserva proteica.

## 4. Lógica de Decisão da IA (Algoritmo Intelectual)

Para cada análise de piquete, a IA deve seguir este fluxo:
1. **Calcular Lotação Geral (Macro)**: Se a fazenda está com < 0.8 UA/ha, há folga.
2. **Verificar Lotação do Piquete (Micro)**: Se > 3 UA/ha, verificar o tempo de permanência.
3. **Avaliar Permanência**: 
   - < 5 dias: Sem risco de superpastejo (rotação rápida).
   - > 15 dias: Alto risco de degradação e morte da planta forrageira.
4. **Cruzamento Climático**: Cruzar com o acumulado de mm da estação `clima.js`.

---
*Fonte: Resumo técnico baseado em Embrapa Gado de Corte e estudos de agronomia aplicada.*
