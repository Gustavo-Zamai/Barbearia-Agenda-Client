/**
 * admin-profissionais.js - Listagem e cadastro de profissionais (admin)
 */

function mostrarErroLista(msg) {
    const box = document.getElementById('alertBox');
    box.textContent = msg;
    box.classList.remove('d-none');
}

function mostrarErroModal(msg) {
    const box = document.getElementById('modalAlertBox');
    box.textContent = msg;
    box.classList.remove('d-none');
}

function esconderErroModal() {
    document.getElementById('modalAlertBox').classList.add('d-none');
}

function criarCardProfissional(p) {
    const col = document.createElement('div');
    col.className = 'col-md-6 col-lg-4';
    const statusStamp = p.ativo
        ? '<span class="stamp stamp-confirmado">Ativo</span>'
        : '<span class="stamp stamp-cancelado">Inativo</span>';

    col.innerHTML = `
        <div class="pick-card h-100 d-flex flex-column">
            <div class="d-flex justify-content-between align-items-start mb-2">
                <div class="pick-title">${p.nome}</div>
                ${statusStamp}
            </div>
            <div class="pick-sub mb-1">${p.email}</div>
            <div class="pick-sub mb-1">${p.telefone}</div>
            <div class="pick-sub mb-3">${p.especialidades || 'Sem especialidades cadastradas'}</div>
            <div class="mono text-muted-custom mb-3" style="font-size: .8rem;">
                ${p.horarioInicio} – ${p.horarioFim} · Comissão ${p.comissaoPercentual}%
            </div>
            <button class="btn ${p.ativo ? 'btn-danger-custom' : 'btn-outline-brass'} btn-sm mt-auto btn-toggle-status" data-id="${p.id}" data-ativo="${p.ativo}">
                ${p.ativo ? 'Desativar' : 'Ativar'}
            </button>
        </div>
    `;

    col.querySelector('.btn-toggle-status').addEventListener('click', async (e) => {
        const btn = e.target;
        const novoStatus = btn.dataset.ativo !== 'true';
        btn.disabled = true;
        try {
            await adminApiAlterarStatusProfissional(btn.dataset.id, novoStatus);
            await carregarProfissionais();
        } catch (err) {
            mostrarErroLista(err.message);
            btn.disabled = false;
        }
    });

    return col;
}

async function carregarProfissionais() {
    const container = document.getElementById('listaProfissionais');
    try {
        const dados = await adminApiListarProfissionais(0, 50);
        const lista = dados.content || dados;

        if (!lista || lista.length === 0) {
            container.innerHTML = '<div class="empty-state">Nenhum profissional cadastrado ainda.</div>';
            return;
        }

        container.innerHTML = '';
        lista.forEach(p => container.appendChild(criarCardProfissional(p)));
    } catch (err) {
        container.innerHTML = `<div class="alert-barbearia alert-danger-custom p-3">${err.message}</div>`;
    }
}

document.getElementById('formNovoProfissional').addEventListener('submit', async (e) => {
    e.preventDefault();
    esconderErroModal();

    const btn = document.getElementById('btnSalvarProfissional');
    btn.disabled = true;
    btn.textContent = 'Cadastrando...';

    try {
        await adminApiCadastrarProfissional({
            nome: document.getElementById('nome').value.trim(),
            email: document.getElementById('email').value.trim(),
            telefone: document.getElementById('telefone').value.trim(),
            senha: document.getElementById('senha').value,
            especialidades: document.getElementById('especialidades').value.trim() || null,
            horarioInicio: document.getElementById('horarioInicio').value + ':00',
            horarioFim: document.getElementById('horarioFim').value + ':00',
            intervaloMinutos: 15,
            comissaoPercentual: parseFloat(document.getElementById('comissaoPercentual').value)
        });

        document.getElementById('formNovoProfissional').reset();
        document.getElementById('horarioInicio').value = '08:00';
        document.getElementById('horarioFim').value = '20:00';
        document.getElementById('comissaoPercentual').value = 50;

        bootstrap.Modal.getInstance(document.getElementById('modalNovoProfissional')).hide();
        await carregarProfissionais();

    } catch (err) {
        mostrarErroModal(err.message);
    } finally {
        btn.disabled = false;
        btn.textContent = 'Cadastrar';
    }
});

document.addEventListener('DOMContentLoaded', () => {
    exigirAdmin();
    carregarProfissionais();
});
