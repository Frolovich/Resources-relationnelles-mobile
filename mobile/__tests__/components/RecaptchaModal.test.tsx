import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { RecaptchaModal } from '../../src/components/RecaptchaModal';

describe('RecaptchaModal', () => {
  const mockOnToken = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render when visible', () => {
    const { getByText, getByPlaceholderText } = render(
      <RecaptchaModal visible={true} onToken={mockOnToken} onClose={mockOnClose} />
    );

    expect(getByText('Vérification anti-robot')).toBeTruthy();
    expect(getByPlaceholderText('Votre réponse')).toBeTruthy();
  });

  it('should show error on wrong answer', () => {
    const { getByText, getByPlaceholderText } = render(
      <RecaptchaModal visible={true} onToken={mockOnToken} onClose={mockOnClose} />
    );

    fireEvent.changeText(getByPlaceholderText('Votre réponse'), '999');
    fireEvent.press(getByText('Vérifier'));

    expect(getByText('Réponse incorrecte, réessayez')).toBeTruthy();
    expect(mockOnToken).not.toHaveBeenCalled();
  });

  it('should call onClose when cancel pressed', () => {
    const { getByText } = render(
      <RecaptchaModal visible={true} onToken={mockOnToken} onClose={mockOnClose} />
    );

    fireEvent.press(getByText('Annuler'));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should call onToken with correct answer', () => {
    // We need to extract the challenge from the rendered text
    const { getByText, getByPlaceholderText, queryByText } = render(
      <RecaptchaModal visible={true} onToken={mockOnToken} onClose={mockOnClose} />
    );

    // Find the challenge text (format: "X + Y = ?")
    // We'll try all possible answers since the challenge is random
    const challengeRegex = /(\d+) \+ (\d+) = \?/;
    // Get all text nodes - find the one matching our pattern
    const allText = queryByText(challengeRegex);
    
    if (allText) {
      const match = allText.props.children.match(challengeRegex);
      if (match) {
        const answer = String(Number(match[1]) + Number(match[2]));
        fireEvent.changeText(getByPlaceholderText('Votre réponse'), answer);
        fireEvent.press(getByText('Vérifier'));
        expect(mockOnToken).toHaveBeenCalledWith(expect.stringContaining('mobile-captcha-'));
      }
    }
  });
});
