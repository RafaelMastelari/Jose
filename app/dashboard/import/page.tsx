'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { processFinancialText } from '@/app/actions/process-financial-text'
import { uploadStatement } from '@/app/actions/upload-statement'

type TabType = 'paste' | 'upload'

interface Transaction {
    date: string
    description: string
    amount: number
    type: 'income' | 'expense' | 'transfer' | 'investment'
    category: string
}

export default function ImportPage() {
    const router = useRouter()
    const [activeTab, setActiveTab] = useState<TabType>('paste')
    const [extractText, setExtractText] = useState('')
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [previewTransactions, setPreviewTransactions] = useState<Transaction[]>([])
    const [duplicates, setDuplicates] = useState<Transaction[]>([])
    const [isDragging, setIsDragging] = useState(false)

    const handleAnalyze = async () => {
        setError('')
        setSuccess('')
        setPreviewTransactions([])
        setDuplicates([])

        if (!extractText.trim()) {
            setError('Por favor, cole um extrato para analisar.')
            return
        }

        setIsAnalyzing(true)

        try {
            const result = await processFinancialText(extractText)

            if (result.success) {
                setSuccess(result.message || 'Transações processadas com sucesso!')
                setPreviewTransactions(result.transactions || [])
                setDuplicates(result.duplicates || [])

                // Redirect to dashboard after 2 seconds
                setTimeout(() => {
                    router.push('/dashboard')
                    router.refresh()
                }, 2000)
            } else {
                setError(result.error || 'Erro ao processar extrato.')
            }
        } catch (err: any) {
            setError('Erro ao processar extrato. Tente novamente.')
            console.error('Analysis error:', err)
        } finally {
            setIsAnalyzing(false)
        }
    }

    const handleFileUpload = async (file: File) => {
        setError('')
        setSuccess('')
        setPreviewTransactions([])
        setDuplicates([])
        setIsAnalyzing(true)

        try {
            const formData = new FormData()
            formData.append('file', file)

            const result = await uploadStatement(formData)

            if (result.success) {
                setSuccess(result.message || 'Arquivo processado com sucesso!')
                setPreviewTransactions(result.transactions || [])
                setDuplicates((result as any).duplicates || [])

                // Redirect to dashboard after 2 seconds
                setTimeout(() => {
                    router.push('/dashboard')
                    router.refresh()
                }, 2000)
            } else {
                setError(result.error || 'Erro ao processar arquivo.')
            }
        } catch (err: any) {
            setError('Erro ao processar arquivo. Tente novamente.')
            console.error('Upload error:', err)
        } finally {
            setIsAnalyzing(false)
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)

        const files = e.dataTransfer.files
        if (files.length > 0) {
            handleFileUpload(files[0])
        }
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = () => {
        setIsDragging(false)
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (files && files.length > 0) {
            handleFileUpload(files[0])
        }
    }

    const handleClear = () => {
        setExtractText('')
        setError('')
        setSuccess('')
        setPreviewTransactions([])
        setDuplicates([])
    }

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'income':
                return 'text-mint-green'
            case 'expense':
                return 'text-red-500'
            case 'transfer':
                return 'text-amber'
            case 'investment':
                return 'text-teal'
            default:
                return 'text-charcoal'
        }
    }

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'income':
                return 'Receita'
            case 'expense':
                return 'Despesa'
            case 'transfer':
                return 'Transferência'
            case 'investment':
                return 'Investimento'
            default:
                return type
        }
    }

    return (
        <div className="min-h-screen bg-ice-blue pb-20">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.back()}
                        className="text-charcoal hover:text-teal transition-colors"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-charcoal">Importar Dados</h1>
                        <p className="text-sm text-gray-600">José vai categorizar suas transações</p>
                    </div>
                </div>
            </div>

            <div className="p-6 max-w-2xl mx-auto">
                {/* Tabs */}
                <div className="flex gap-2 mb-6 bg-white rounded-lg p-1 shadow-sm">
                    <button
                        onClick={() => setActiveTab('paste')}
                        className={`flex-1 py-3 px-4 rounded-md font-medium transition-all ${activeTab === 'paste'
                            ? 'bg-teal text-white'
                            : 'text-charcoal hover:bg-gray-100'
                            }`}
                    >
                        <span className="material-symbols-outlined text-sm align-middle mr-2">
                            content_paste
                        </span>
                        Colar Extrato
                    </button>
                    <button
                        onClick={() => setActiveTab('upload')}
                        className={`flex-1 py-3 px-4 rounded-md font-medium transition-all ${activeTab === 'upload'
                            ? 'bg-teal text-white'
                            : 'text-charcoal hover:bg-gray-100'
                            }`}
                    >
                        <span className="material-symbols-outlined text-sm align-middle mr-2">
                            upload_file
                        </span>
                        Upload Arquivo
                    </button>
                </div>

                {/* Paste Tab Content */}
                {activeTab === 'paste' && (
                    <div className="space-y-4">
                        {/* Info Box */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <span className="material-symbols-outlined text-blue-600">info</span>
                                <div className="text-sm text-blue-900">
                                    <p className="font-medium mb-1">Como usar:</p>
                                    <ol className="list-decimal list-inside space-y-1 text-blue-800">
                                        <li>Copie seu extrato bancário (pode ser do PDF, app, etc.)</li>
                                        <li>Cole no campo abaixo</li>
                                        <li>José vai identificar e categorizar automaticamente!</li>
                                    </ol>
                                </div>
                            </div>
                        </div>

                        {/* Textarea */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                            <label className="block text-sm font-medium text-charcoal mb-2">
                                Extrato Bancário
                            </label>
                            <textarea
                                value={extractText}
                                onChange={(e) => setExtractText(e.target.value)}
                                placeholder={`Cole aqui o extrato do seu banco...

Exemplo:
05/01/2026 - Salário Empresa XYZ - R$ 5.000,00
08/01/2026 - Supermercado ABC - R$ -250,00
10/01/2026 - Aplicação CDB - R$ -1.000,00
12/01/2026 - Uber - R$ -45,50
15/01/2026 - Transferência mesma titularidade - R$ -500,00`}
                                className="w-full h-64 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-teal focus:border-teal transition-all font-mono text-sm"
                                disabled={isAnalyzing}
                            />
                            <div className="flex items-center justify-between mt-2">
                                <span className="text-xs text-gray-500">
                                    {extractText.length} caracteres
                                </span>
                                {extractText.length > 0 && (
                                    <button
                                        onClick={handleClear}
                                        className="text-xs text-gray-600 hover:text-charcoal transition-colors"
                                        disabled={isAnalyzing}
                                    >
                                        Limpar
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Analyze Button */}
                        <button
                            onClick={handleAnalyze}
                            disabled={isAnalyzing || !extractText.trim()}
                            className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-4 px-6 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg"
                        >
                            {isAnalyzing ? (
                                <>
                                    <svg
                                        className="animate-spin h-5 w-5"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        ></circle>
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        ></path>
                                    </svg>
                                    José está analisando suas transações...
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined">auto_awesome</span>
                                    Analisar com José
                                </>
                            )}
                        </button>
                    </div>
                )}

                {/* Upload Tab Content */}
                {activeTab === 'upload' && (
                    <div className="space-y-4">
                        {/* Info Box */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <span className="material-symbols-outlined text-blue-600">info</span>
                                <div className="text-sm text-blue-900">
                                    <p className="font-medium mb-1">Formatos aceitos:</p>
                                    <ul className="list-disc list-inside space-y-1 text-blue-800">
                                        <li><strong>.OFX</strong> - Formato Nubank/Bancos</li>
                                        <li><strong>.CSV</strong> - Planilha de exportação</li>
                                        <li><strong>.PDF</strong> - Extrato em PDF</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Drag and Drop Area */}
                        <div
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            className={`bg-white rounded-lg shadow-sm border-2 border-dashed p-12 text-center transition-all ${isDragging
                                ? 'border-teal bg-teal/5 scale-[1.02]'
                                : 'border-gray-300 hover:border-gray-400'
                                }`}
                        >
                            <input
                                type="file"
                                id="file-upload"
                                className="hidden"
                                accept=".ofx,.csv,.pdf"
                                onChange={handleFileChange}
                                disabled={isAnalyzing}
                            />
                            <label
                                htmlFor="file-upload"
                                className="cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-6xl text-gray-300 mb-4 block">
                                    upload_file
                                </span>
                                <h3 className="text-lg font-medium text-charcoal mb-2">
                                    Arraste seu arquivo aqui
                                </h3>
                                <p className="text-sm text-gray-600 mb-4">
                                    ou clique para selecionar
                                </p>
                                <p className="text-xs text-gray-500">
                                    OFX, CSV ou PDF • Máximo 10MB
                                </p>
                            </label>
                        </div>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 mt-4">
                        <span className="material-symbols-outlined text-red-600">error</span>
                        <p className="text-sm text-red-900">{error}</p>
                    </div>
                )}

                {/* Success Message */}
                {success && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                        <div className="flex items-start gap-3">
                            <span className="material-symbols-outlined text-mint-green">
                                check_circle
                            </span>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-green-900">{success}</p>
                                {duplicates.length > 0 && (
                                    <p className="text-xs text-green-700 mt-1">
                                        {duplicates.length} transações duplicadas foram ignoradas.
                                    </p>
                                )}
                                <p className="text-xs text-green-700 mt-2">
                                    Redirecionando para o dashboard...
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Preview Transactions */}
                {previewTransactions.length > 0 && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mt-4">
                        <h3 className="font-medium text-charcoal mb-3">
                            Transações Importadas ({previewTransactions.length})
                        </h3>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {previewTransactions.map((transaction, index) => (
                                <div
                                    key={index}
                                    className="flex items-start justify-between p-3 bg-gray-50 rounded-lg"
                                >
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-charcoal">
                                            {transaction.description}
                                        </p>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="text-xs text-gray-600">
                                                {new Date(transaction.date).toLocaleDateString('pt-BR')}
                                            </span>
                                            <span
                                                className={`text-xs font-medium ${getTypeColor(
                                                    transaction.type
                                                )}`}
                                            >
                                                {getTypeLabel(transaction.type)}
                                            </span>
                                            <span className="text-xs text-gray-600">
                                                {transaction.category}
                                            </span>
                                        </div>
                                    </div>
                                    <span
                                        className={`text-sm font-bold ${getTypeColor(
                                            transaction.type
                                        )}`}
                                    >
                                        R$ {transaction.amount.toFixed(2)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
