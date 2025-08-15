// ✅ Mock del init de Firebase para evitar getFirestore(app)
jest.mock('../../firebase/firebaseConfig', () => ({
  db: {},
  auth: null,
}));

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Mock del UserContext: sesión iniciada
jest.mock('../../UserContext', () => ({
  useUser: () => ({ logueado: true }),
}));

// Mock Firestore (todo dentro del factory)
jest.mock('firebase/firestore', () => {
  const fns = {
    collection: jest.fn(),
    onSnapshot: jest.fn(),
    getDocs: jest.fn(),
    updateDoc: jest.fn(),
    deleteDoc: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    doc: jest.fn(),
  };
  return fns;
});

import * as fs from 'firebase/firestore';
import Dashboard from '../../admin/Dashboard';

beforeEach(() => {
  jest.clearAllMocks();

  fs.collection.mockReturnValue({ __type: 'collection(reservas)' });
  fs.doc.mockImplementation((_db, _col, id) => ({ __type: 'doc', id }));

  // 1 reserva activa inicial
  fs.onSnapshot.mockImplementation((_colRef, cb) => {
    const fakeDocs = [
      {
        id: 'id1',
        data: () => ({
          nombre: 'Ana',
          correo: 'ana@mail.com',
          telefono: '900111222',
          fecha: '2025-08-20',
          hora: '12:00',
          mesa: 'Mesa 1',
          codigo: 'R-000111',
          estado: 'activa',
        }),
      },
    ];
    cb({ docs: fakeDocs });
    return () => {};
  });
});

test('edita una reserva y llama updateDoc si no hay conflicto', async () => {
  render(<Dashboard />);

  // Abre el editor
  fireEvent.click(await screen.findByText(/Editar/i));

  // ⚠️ El label "Mesa" no está enlazado con htmlFor; seleccionamos por atributo name
  const selectMesa = document.querySelector('select[name="mesa"]');
  fireEvent.change(selectMesa, { target: { value: 'Mesa 2' } });

  // Mock de getDocs para consulta de conflicto: sin conflictos
  fs.getDocs.mockResolvedValueOnce({ docs: [] });

  // Guardar
  fireEvent.click(screen.getByText(/Guardar/i));

  await waitFor(() => {
    expect(fs.getDocs).toHaveBeenCalled();
    expect(fs.updateDoc).toHaveBeenCalled();
  });
});

test('NO actualiza si hay conflicto de mesa/fecha/hora', async () => {
  render(<Dashboard />);

  fireEvent.click(await screen.findByText(/Editar/i));

  const selectMesa = document.querySelector('select[name="mesa"]');
  fireEvent.change(selectMesa, { target: { value: 'Mesa 2' } });

  // Mock: la consulta de conflicto devuelve un doc (simula ocupada)
  fs.getDocs.mockResolvedValueOnce({
    docs: [{ id: 'otroId', data: () => ({}) }],
  });

  // Guardar
  fireEvent.click(screen.getByText(/Guardar/i));

  await waitFor(() => {
    expect(fs.getDocs).toHaveBeenCalled();
    expect(fs.updateDoc).not.toHaveBeenCalled();
  });
});
