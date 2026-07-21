/**
 * admin-dashboard.js - Lógica do painel administrativo (visão geral)
 */

const MESES_ADMIN = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

function formatarMoedaAdmin(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function mostrarErroAdmin(msg) {
    const box = document.getElementById('alertBox');
    box.textContent = msg;
    box.classList.remove('d-none');
}

async function carregarMetricas() {
    try {
        const m = await adminApiMetricas();
        document.getElementById('mClientes').textContent = m.totalClientes ?? '—';
        document.getElementById('mProfissionais').textContent = m.totalProfissionais ?? '—';
        document.getElementById('mServicos').textContent = m.totalServicos ?? '—';
        document.getElementById('mAgendamentosHoje').textContent = m.totalAgendamentosHoje ?? '—';
    } catch (err) {
        mostrarErroAdmin(err.message);
    }
}

async function carregarFaturamento(inicio, fim) {
    try {
        const resultado = await adminApiFaturamento(inicio, fim);
        document.getElementById('faturamentoTotal').textContent = formatarMoedaAdmin(resultado.total);
    } catch (err) {
        mostrarErroAdmin(err.message);
    }
}

function criarLinhaHoje(agendamento) {
    const statusClass = 'stamp-' + agendamento.status.toLowerCase();
    const hora = new Date(agendamento.dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const el = document.createElement('div');
    el.className = 'ticket';
    el.innerHTML = `
        <div class="ticket-stub">
            <span class="ticket-day mono" style="font-size: 1.1rem;">${hora}</span>
        </div>
        <div class="ticket-body">
            <div class="ticket-info">
                <div class="ticket-servico">${agendamento.servicoNome}</div>
                <div class="ticket-meta">${agendamento.clienteNome} · com ${agendamento.profissionalNome}</div>
            </div>
            <span class="stamp ${statusClass}">${agendamento.status}</span>
        </div>
    `;
    return el;
}

async function carregarAgendamentosHoje() {
    const container = document.getElementById('listaHoje');
    try {
        const agendamentos = await adminApiAgendamentosHoje();
        if (!agendamentos || agendamentos.length === 0) {
            container.innerHTML = '<div class="empty-state">Nenhum agendamento para hoje.</div>';
            return;
        }
        container.innerHTML = '';
        agendamentos
            .sort((a, b) => new Date(a.dataHora) - new Date(b.dataHora))
            .forEach(a => container.appendChild(criarLinhaHoje(a)));
    } catch (err) {
        container.innerHTML = `<div class="alert-barbearia alert-danger-custom p-3">${err.message}</div>`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    exigirAdmin();

    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0];
    const hojeStr = hoje.toISOString().split('T')[0];

    document.getElementById('dataInicio').value = inicioMes;
    document.getElementById('dataFim').value = hojeStr;

    document.getElementById('formPeriodo').addEventListener('submit', (e) => {
        e.preventDefault();
        carregarFaturamento(
            document.getElementById('dataInicio').value,
            document.getElementById('dataFim').value
        );
    });

    carregarMetricas();
    carregarFaturamento(inicioMes, hojeStr);
    carregarAgendamentosHoje();
});
