const API_URL = 'http://localhost:3001';
const tabelaCorpo = document.getElementById('tabelaCorpo');
const formAdicionar = document.getElementById('formAdicionar');
const popupEditar = document.getElementById('popupEditar');
const formEditar = document.getElementById('formEditar');

// --- FUNÇÕES AUXILIARES ---

// Formata um número para o formato de moeda BRL (ex: 25.9 -> "R$ 25,90")
function formatarParaMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
}

// Converte uma string de moeda BRL para um número (ex: "R$ 25,90" -> 25.90)
function parseMoeda(valor) {
    if (typeof valor !== 'string') return valor;
    return parseFloat(valor.replace('R$', '').replace(/\./g, '').replace(',', '.').trim());
}

// --- LÓGICA PRINCIPAL ---

// 1. Carregar e renderizar todos os produtos
async function carregarProdutos() {
    try {
        const response = await fetch(`${API_URL}/products`);
        if (!response.ok) throw new Error('Erro ao buscar produtos');
        const produtos = await response.json();

        tabelaCorpo.innerHTML = ''; // Limpa a tabela antes de preencher
        produtos.forEach(produto => {
            const tr = document.createElement('tr');
            tr.setAttribute('data-id', produto.id); // Armazena o ID do produto

            tr.innerHTML = `
                <td>${produto.name}</td>
                <td>${produto.description}</td>
                <td>${formatarParaMoeda(produto.price)}</td>
                <td><a href="${produto.link}" target="_blank">Ver</a></td>
                <td>
                    <button class="btn-editar">Editar</button>
                    <button class="btn-excluir">Excluir</button>
                </td>
            `;
            tabelaCorpo.appendChild(tr);
        });
    } catch (error) {
        console.error('Falha ao carregar produtos:', error);
        alert('Não foi possível carregar os produtos. Verifique se a API está rodando.');
    }
}

// 2. Adicionar um novo produto
formAdicionar.addEventListener('submit', async (e) => {
    e.preventDefault();

    const produto = {
        name: document.getElementById('novoNome').value,
        description: document.getElementById('novoDescricao').value,
        price: parseMoeda(document.getElementById('novoValor').value),
        link: document.getElementById('novoLink').value
    };

    try {
        const response = await fetch(`${API_URL}/products`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(produto),
        });
        if (!response.ok) throw new Error('Erro ao adicionar produto');

        formAdicionar.reset(); // Limpa o formulário
        carregarProdutos(); // Recarrega a lista
    } catch (error) {
        console.error('Falha ao adicionar produto:', error);
        alert('Não foi possível adicionar o produto.');
    }
});

// 3. Editar e Excluir produtos (usando delegação de eventos)
tabelaCorpo.addEventListener('click', async (e) => {
    const tr = e.target.closest('tr');
    if (!tr) return;
    const id = tr.dataset.id;

    // Ação de Excluir
    if (e.target.classList.contains('btn-excluir')) {
        if (confirm('Deseja realmente excluir este produto?')) {
            try {
                const response = await fetch(`${API_URL}/products/${id}`, { method: 'DELETE' });
                if (!response.ok) throw new Error('Erro ao excluir produto');
                carregarProdutos(); // Recarrega a lista
            } catch (error) {
                console.error('Falha ao excluir produto:', error);
                alert('Não foi possível excluir o produto.');
            }
        }
    }

    // Ação de Editar
    if (e.target.classList.contains('btn-editar')) {
        abrirPopup(id);
    }
});

// 4. Funções do Popup de Edição
async function abrirPopup(id) {
    try {
        const response = await fetch(`${API_URL}/products/${id}`);
        if (!response.ok) throw new Error('Produto não encontrado');
        const produto = await response.json();

        document.getElementById('editarId').value = produto.id;
        document.getElementById('editarNome').value = produto.name;
        document.getElementById('editarDescricao').value = produto.description;
        document.getElementById('editarValor').value = produto.price.toString().replace('.', ','); // Formato simples para edição
        document.getElementById('editarLink').value = produto.link;
        
        popupEditar.style.display = 'block';
    } catch (error) {
        console.error('Falha ao buscar produto para edição:', error);
        alert('Não foi possível carregar os dados para edição.');
    }
}

function fecharPopup() {
    popupEditar.style.display = 'none';
}

formEditar.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('editarId').value;
    
    const produtoAtualizado = {
        name: document.getElementById('editarNome').value,
        description: document.getElementById('editarDescricao').value,
        price: parseMoeda(document.getElementById('editarValor').value),
        link: document.getElementById('editarLink').value
    };

    try {
        const response = await fetch(`${API_URL}/products/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(produtoAtualizado),
        });
        if (!response.ok) throw new Error('Erro ao salvar edição');

        fecharPopup();
        carregarProdutos(); // Recarrega a lista para mostrar as alterações
    } catch (error) {
        console.error('Falha ao salvar edição:', error);
        alert('Não foi possível salvar as alterações.');
    }
});

// --- CARREGAMENTO INICIAL ---
document.addEventListener('DOMContentLoaded', carregarProdutos);
