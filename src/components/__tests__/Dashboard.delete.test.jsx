// src/components/__tests__/Dashboard.delete.test.jsx
jest.mock('../../firebase/firebaseConfig', () => ({ db: {}, auth: null }));
jest.mock('firebase/app', () => ({ initializeApp: jest.fn(() => ({})) }));

jest.mock('firebase/firestore', () => {
  const fns = {
    getFirestore: jest.fn(() => ({})),
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

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';

// sesión iniciada
jest.mock('../../UserContext', () => ({ useUser: () => ({ logueado: true }) }));

import * as fs from 'firebase/firestore';
import Dashboard from '../../admin/Dashboard';

beforeAll(() => {
  window.confirm = jest.fn(() => true);
  window.alert = jest.fn(); // silenciar alert en jsdom
});

beforeEach(() => {
  jest.clearAllMocks();

  fs.collection.mockReturnValue({ __type: 'collection(reservas)' });
  fs.doc.mockImplementation((_db, _col, id) => ({ __type: 'doc', id }));

  // 2 reservas iniciales
  fs.onSnapshot.mockImplementation((_colRef, cb) => {
    cb({
      docs: [
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
        {
          id: 'id2',
          data: () => ({
            nombre: 'Bruno',
            correo: 'bruno@mail.com',
            telefono: '900333444',
            fecha: '2025-08-21',
            hora: '13:00',
            mesa: 'Mesa 2',
            codigo: 'R-000222',
            estado: 'activa',
          }),
        },
      ],
    });
    return () => {};
  });
});

describe('Dashboard - eliminar', () => {
  test('elimina una reserva individual al confirmar', async () => {
    render(<Dashboard />);

    // Espera a que aparezca la fila de Ana y toma ESA fila
    const filaAna = await screen.findByText('Ana');
    const row = filaAna.closest('tr');

    // Click en el botón "Eliminar" de esa fila (no el de "Eliminar todas")
    const btnEliminarFila = within(row).getByRole('button', { name: /^Eliminar$/i });
    fireEvent.click(btnEliminarFila);

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalled();
      expect(fs.deleteDoc).toHaveBeenCalledTimes(1);
      expect(fs.deleteDoc.mock.calls[0][0]).toEqual({ __type: 'doc', id: 'id1' });
    });
  });

  test('elimina TODAS las reservas al confirmar', async () => {
    render(<Dashboard />);

    // Solo aquí necesitamos mockear getDocs
    fs.getDocs.mockResolvedValueOnce({
      docs: [
        { id: 'id1', data: () => ({}) },
        { id: 'id2', data: () => ({}) },
      ],
    });

    fireEvent.click(screen.getByRole('button', { name: /Eliminar todas/i }));

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalled();
      expect(fs.deleteDoc).toHaveBeenCalledTimes(2);
      const ids = fs.deleteDoc.mock.calls.map((c) => c[0].id).sort();
      expect(ids).toEqual(['id1', 'id2']);
    });
  });

  test('limpia SOLO las anuladas', async () => {
    render(<Dashboard />);

    fs.getDocs.mockResolvedValueOnce({
      docs: [
        { id: 'a1', data: () => ({ estado: 'anulada' }) },
        { id: 'a2', data: () => ({ estado: 'activa' }) },
        { id: 'a3', data: () => ({ estado: 'anulada' }) },
      ],
    });

    fireEvent.click(screen.getByRole('button', { name: /Limpiar anuladas/i }));

    await waitFor(() => {
      const ids = fs.deleteDoc.mock.calls.map((c) => c[0].id).sort();
      expect(ids).toEqual(['a1', 'a3']);
    });
  });
});
