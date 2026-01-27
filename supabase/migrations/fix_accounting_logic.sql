-- Advanced Accounting Logic - Data Correction Migration
-- This migration corrects existing transactions to properly classify transfers and investments

-- ========================================
-- 1. FIX TRANSFERS (Self-transactions)
-- ========================================

-- Correction transfer entries that contain common keywords
UPDATE transactions
SET 
   type = 'transfer',
    category = 'transfer'
WHERE 
    type != 'transfer'
    AND (
        description ILIKE '%transferência entre contas%' 
        OR description ILIKE '%transferencia entre contas%'
        OR description ILIKE '%transf entre contas%'
        OR description ILIKE '%ted própria%'
        OR description ILIKE '%ted propria%'
        OR description ILIKE '%pix próprio%'
        OR description ILIKE '%pix proprio%'
        OR description ILIKE '%mesma titularidade%'
        OR description ILIKE '%conta própria%'
        OR description ILIKE '%conta propria%'
    );

-- ========================================
-- 2. FIX INVESTMENT APPLICATIONS (Negative)
-- ========================================

-- Reclassify applications that were incorrectly marked as expenses
UPDATE transactions
SET 
    type = 'investment',
    category = 'investimento'
WHERE 
    type != 'investment'
    AND amount < 0
    AND (
        description ILIKE '%aplicação%'
        OR description ILIKE '%aplicacao%'
        OR description ILIKE '%apl cdb%'
        OR description ILIKE '%apl rdb%'
        OR description ILIKE '%cdb%'
        OR description ILIKE '%rdb%'
        OR description ILIKE '%lci%'
        OR description ILIKE '%lca%'
        OR description ILIKE '%poupança%'
        OR description ILIKE '%poupanca%'
        OR description ILIKE '%tesouro%'
        OR description ILIKE '%fundo%'
    );

-- ========================================
-- 3. FIX INVESTMENT REDEMPTIONS (Positive)
-- ========================================

-- Reclassify redemptions that were incorrectly marked as income
UPDATE transactions
SET 
    type = 'investment',
    category = 'investimento'
WHERE 
    type = 'income'  -- Only fix those marked as income
    AND amount > 0
    AND (
        description ILIKE '%resgate%'
        OR description ILIKE '%resg%'
        OR description ILIKE '%resgate cdb%'
        OR description ILIKE '%resgate rdb%'
        OR description ILIKE '%rendimento cdb%'
        OR description ILIKE '%rendimento rdb%'
    );

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Check transfer count
SELECT 
    'Transferências' as tipo,
    COUNT(*) as total,
    SUM(CASE WHEN amount > 0 THEN 1 ELSE 0 END) as entradas,
    SUM(CASE WHEN amount < 0 THEN 1 ELSE 0 END) as saidas
FROM transactions
WHERE type = 'transfer';

-- Check investment count with applications vs redemptions
SELECT 
    'Investimentos' as tipo,
    COUNT(*) as total,
    SUM(CASE WHEN amount > 0 THEN 1 ELSE 0 END) as resgates,
    SUM(CASE WHEN amount < 0 THEN 1 ELSE 0 END) as aplicacoes,
    SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as total_aplicado,
    SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as total_resgatado,
    (SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) - SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END)) as investimento_liquido
FROM transactions
WHERE type = 'investment';

-- Check income/expense breakdown
SELECT 
    type,
    COUNT(*) as total,
    SUM(amount) as total_amount
FROM transactions
GROUP BY type
ORDER BY type;
