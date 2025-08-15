// Mock del init de Firebase
jest.mock('../../firebase/firebaseConfig', () => ({
  db: {},
  auth: null,
}));

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CrearReservaAdmin from '../../admin/CrearReservaAdmin';

// ✅ Mock Firestore con getFirestore
jest.mock('firebase/firestore', () => {
  return {
    getFirestore: jest.fn(() => ({})),
    collection: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    // Simula que ya hay una reserva en la misma fecha/hora/mesa
    getDocs: jest.fn(() =>
      Promise.resolve({
        docs: [
          {
            data: () => ({
              nombre: 'Otro',
              correo: 'otro@mail.com',
              telefono: '111111111',
              fecha: '2025-08-20',
              hora: '12:00',
              mesa: 'Mesa 1',
              estado: 'activa',
            }),
          },
        ],
      })
    ),
    addDoc: jest.fn(),
  };
});

describe('CrearReservaAdmin - mesa ocupada', () => {
  test('muestra alert cuando la mesa ya está reservada', async () => {
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

    render(<CrearReservaAdmin />);

    fireEvent.change(screen.getByLabelText(/Nombre:/i),   { target: { value: 'Juan' } });
    fireEvent.change(screen.getByLabelText(/Correo:/i),   { target: { value: 'juan@mail.com' } });
    fireEvent.change(screen.getByLabelText(/Teléfono:/i), { target: { value: '999999999' } });
    fireEvent.change(screen.getByLabelText(/Fecha:/i),    { target: { value: '2025-08-20' } });
    fireEvent.change(screen.getByLabelText(/Hora:/i),     { target: { value: '12:00' } });
    fireEvent.change(screen.getByLabelText(/Mesa:/i),     { target: { value: 'Mesa 1' } });

    // 👇 Evita la colisión con el <h2>
    fireEvent.click(screen.getByRole('button', { name: /Crear Reserva/i }));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalled();
      expect(alertSpy.mock.calls[0][0]).toMatch(/ya está reservada|ya está ocupada/i);
    });

    alertSpy.mockRestore();
  });
});
