import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Stepper } from './stepper';

const steps = [
  { id: 1, label: 'ຂັ້ນຕອນທີ 1', description: 'ຂໍ້ມູນພື້ນຖານ' },
  { id: 2, label: 'ຂັ້ນຕອນທີ 2', description: 'ເຕັກນິກ' },
  { id: 3, label: 'ຂັ້ນຕອນທີ 3', description: 'ກຳນົດເວລາ' },
  { id: 4, label: 'ຂັ້ນຕອນທີ 4', description: 'ກວດສອບ' },
];

describe('Stepper', () => {
  it('renders all steps with labels', () => {
    render(<Stepper steps={steps} currentStep={2} />);
    expect(screen.getByText('ຂັ້ນຕອນທີ 1')).toBeInTheDocument();
    expect(screen.getByText('ຂັ້ນຕອນທີ 2')).toBeInTheDocument();
    expect(screen.getByText('ຂັ້ນຕອນທີ 3')).toBeInTheDocument();
    expect(screen.getByText('ຂັ້ນຕອນທີ 4')).toBeInTheDocument();
  });

  it('marks current step with aria-current="step"', () => {
    render(<Stepper steps={steps} currentStep={2} />);
    const step2Button = screen.getByRole('button', { name: '2' });
    expect(step2Button).toHaveAttribute('aria-current', 'step');
  });

  it('allows clicking previous completed steps', async () => {
    const user = userEvent.setup();
    const onStepClick = vi.fn();
    render(<Stepper steps={steps} currentStep={3} onStepClick={onStepClick} />);

    // Step 1 is done, so its button is clickable
    const buttons = screen.getAllByRole('button');
    await user.click(buttons[0]);
    expect(onStepClick).toHaveBeenCalledWith(1);
  });
});
