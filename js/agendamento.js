/**
 * agendamento.js - Lógica do fluxo de agendamento (4 passos)
 */

const MESES_ABREV = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

const estado = {
    clienteId: null,
    servico: null,
    profissional: null,
    data: null,
    horario: null
};

function mostrarErro(msg) {
    const box = document.getElementById('alertBox');
    box.textContent = msg;
    box.classList.remove('d-none');
}

function esconderErro() {
    document.getElementById('alertBox').classList.add('d-none');
}

function formatarMoeda(valor) {
    return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function irPara(passo) {
    [1, 2, 3, 4].forEach(n => {
        document.getElementById(`step${n}`).classList.toggle('d-none', n !== passo);
        const tab = document.getElementById(`step${n}Tab`);
        tab.classList.remove('active', 'done');
        if (n === passo) tab.classList.add('active');
        if (n < passo) tab.classList.add('done');
    });
}

function voltarPara(passo) {
    esconderErro();
    irPara(passo);
}

// ---------- Passo 1: Serviço ----------
async function carregarServicos() {
    const container = document.getElementById('listaServicos');
    try {
        const servicos = await apiListarServicosAtivos();
        if (servicos.length === 0) {
            container.innerHTML = '<div class="empty-state">Nenhum serviço disponível no momento.</div>';
            return;
        }
        container.innerHTML = '';
        servicos.forEach(s => {
            const col = document.createElement('div');
            col.className = 'col-md-6';
            col.innerHTML = `
                <div class="pick-card" data-id="${s.id}">
                    <div class="pick-title">${s.nome}</div>
                    <div class="pick-sub">${s.duracaoMinutos} min ${s.categoria ? '· ' + s.categoria : ''}</div>
                    <div class="pick-price">${formatarMoeda(s.preco)}</div>
                </div>
            `;
            col.querySelector('.pick-card').addEventListener('click', () => selecionarServico(s));
            container.appendChild(col);
        });
    } catch (err) {
        container.innerHTML = `<div class="alert-barbearia alert-danger-custom p-3">${err.message}</div>`;
    }
}

function selecionarServico(servico) {
    estado.servico = servico;
    document.querySelectorAll('#listaServicos .pick-card').forEach(c => {
        c.classList.toggle('selected', Number(c.dataset.id) === servico.id);
    });
    setTimeout(() => {
        irPara(2);
        if (!document.getElementById('listaProfissionais').dataset.loaded) {
            carregarProfissionais();
        }
    }, 150);
}

// ---------- Passo 2: Profissional ----------
async function carregarProfissionais() {
    const container = document.getElementById('listaProfissionais');
    container.dataset.loaded = '1';
    try {
        const profissionais = await apiListarProfissionaisAtivos();
        if (profissionais.length === 0) {
            container.innerHTML = '<div class="empty-state">Nenhum profissional disponível no momento.</div>';
            return;
        }
        container.innerHTML = '';
        profissionais.forEach(p => {
            const col = document.createElement('div');
            col.className = 'col-md-6';
            col.innerHTML = `
                <div class="pick-card" data-id="${p.id}">
                    <div class="pick-title">${p.nome}</div>
                    <div class="pick-sub">${p.especialidades || 'Barbeiro'}</div>
                </div>
            `;
            col.querySelector('.pick-card').addEventListener('click', () => selecionarProfissional(p));
            container.appendChild(col);
        });
    } catch (err) {
        container.innerHTML = `<div class="alert-barbearia alert-danger-custom p-3">${err.message}</div>`;
    }
}

function selecionarProfissional(profissional) {
    estado.profissional = profissional;
    document.querySelectorAll('#listaProfissionais .pick-card').forEach(c => {
        c.classList.toggle('selected', Number(c.dataset.id) === profissional.id);
    });
    setTimeout(() => {
        irPara(3);
        const hoje = new Date().toISOString().split('T')[0];
        const dataInput = document.getElementById('dataAgendamento');
        if (!dataInput.value) {
            dataInput.value = hoje;
            dataInput.min = hoje;
            carregarHorarios();
        }
    }, 150);
}

// ---------- Passo 3: Data e hora ----------
async function carregarHorarios() {
    const container = document.getElementById('listaHorarios');
    const data = document.getElementById('dataAgendamento').value;
    if (!data) return;

    estado.data = data;
    container.innerHTML = '<div class="text-muted-custom">Carregando horários...</div>';

    try {
        const horarios = await apiBuscarHorariosDisponiveis(
            estado.profissional.id, data, estado.servico.duracaoMinutos
        );

        if (horarios.length === 0) {
            container.innerHTML = '<div class="empty-state">Sem horários disponíveis nesse dia. Tente outra data.</div>';
            return;
        }

        container.innerHTML = '';
        horarios.forEach(h => {
            const btn = document.createElement('button');
            btn.className = 'slot-btn';
            btn.textContent = h.horarioFormatado;
            btn.disabled = !h.disponivel;
            if (h.disponivel) {
                btn.addEventListener('click', () => selecionarHorario(h, btn));
            }
            container.appendChild(btn);
        });
    } catch (err) {
        container.innerHTML = `<div class="alert-barbearia alert-danger-custom p-3">${err.message}</div>`;
    }
}

function selecionarHorario(horario, btnEl) {
    estado.horario = horario;
    document.querySelectorAll('#listaHorarios .slot-btn').forEach(b => b.classList.remove('selected'));
    btnEl.classList.add('selected');

    setTimeout(() => {
        montarResumo();
        irPara(4);
    }, 150);
}

document.addEventListener('change', (e) => {
    if (e.target.id === 'dataAgendamento') carregarHorarios();
});

// ---------- Passo 4: Confirmar ----------
function montarResumo() {
    const d = new Date(estado.horario.horario);
    document.getElementById('resumoDia').textContent = String(d.getDate()).padStart(2, '0');
    document.getElementById('resumoMes').textContent = MESES_ABREV[d.getMonth()];
    document.getElementById('resumoServico').textContent = estado.servico.nome;
    document.getElementById('resumoDetalhe').textContent =
        `${estado.horario.horarioFormatado} · ${estado.profissional.nome} · ${formatarMoeda(estado.servico.preco)}`;
}

async function confirmarAgendamento() {
    esconderErro();
    const btn = document.getElementById('btnConfirmarAgendamento');
    btn.disabled = true;
    btn.textContent = 'Confirmando...';

    try {
        if (!estado.clienteId) {
            const cliente = await apiClienteLogado();
            estado.clienteId = cliente.id;
        }

        await apiCriarAgendamento({
            clienteId: estado.clienteId,
            profissionalId: estado.profissional.id,
            servicoId: estado.servico.id,
            dataHora: estado.horario.horario,
            observacoes: document.getElementById('observacoes').value.trim() || null
        });

        document.querySelectorAll('.step-panel').forEach(p => p.classList.add('d-none'));
        document.getElementById('stepSucesso').classList.remove('d-none');
        document.querySelectorAll('.stepper li').forEach(li => li.classList.add('done'));

    } catch (err) {
        mostrarErro(err.message);
    } finally {
        btn.disabled = false;
        btn.textContent = 'Confirmar agendamento';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    carregarServicos();
    document.getElementById('btnConfirmarAgendamento').addEventListener('click', confirmarAgendamento);
});
