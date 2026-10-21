import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { lo } from '@/lib/i18n/lo';
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
    const step2Button = screen.getByRole('button', { name: lo.stepper.stepName(2, 'ຂັ້ນຕອນທີ 2', 'current') });
    expect(step2Button).toHaveAttribute('aria-current', 'step');
  });

  it('has a Lao navigation label and names steps with state', () => {
    render(<Stepper steps={steps} currentStep={2} />);
    expect(screen.getByRole('navigation', { name: lo.stepper.nav })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: lo.stepper.stepName(1, 'ຂັ້ນຕອນທີ 1', 'done') })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: lo.stepper.stepName(3, 'ຂັ້ນຕອນທີ 3', 'todo') })).toBeInTheDocument();
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

  it('maxReachedStep keeps later reached steps done and clickable, current stays current', async () => {
    const user = userEvent.setup();
    const onStepClick = vi.fn();
    render(<Stepper steps={steps} currentStep={1} maxReachedStep={3} onStepClick={onStepClick} />);
    expect(screen.getByRole('button', { name: lo.stepper.stepName(1, 'ຂັ້ນຕອນທີ 1', 'current') })).toHaveAttribute('aria-current', 'step');
    await user.click(screen.getByRole('button', { name: lo.stepper.stepName(3, 'ຂັ້ນຕອນທີ 3', 'done') }));
    expect(onStepClick).toHaveBeenCalledWith(3);
    expect(screen.getByRole('button', { name: lo.stepper.stepName(4, 'ຂັ້ນຕອນທີ 4', 'todo') })).toBeDisabled();
  });
});
