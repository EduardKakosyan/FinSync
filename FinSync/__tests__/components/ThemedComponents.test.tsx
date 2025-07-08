import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemedText } from '../../src/components/template/ThemedText';
import { ThemedView } from '../../src/components/template/ThemedView';

// Mock useThemeColor hook
jest.mock('../../hooks/useThemeColor', () => ({
  useThemeColor: jest.fn((props, colorName) => {
    // Return default colors based on colorName
    const colors = {
      text: '#11181C',
      background: '#fff',
    };
    return colors[colorName] || props.light || '#000';
  }),
}));

describe('ThemedText Component', () => {
  describe('Basic Rendering', () => {
    it('renders with default props', () => {
      const { getByText } = render(<ThemedText>Test Text</ThemedText>);
      expect(getByText('Test Text')).toBeTruthy();
    });

    it('applies custom light and dark colors', () => {
      const { getByText } = render(
        <ThemedText lightColor="#FF0000" darkColor="#00FF00">
          Colored Text
        </ThemedText>
      );
      
      const textElement = getByText('Colored Text');
      expect(textElement).toBeTruthy();
    });

    it('renders with custom style', () => {
      const customStyle = { fontSize: 20, fontWeight: 'bold' };
      const { getByText } = render(
        <ThemedText style={customStyle}>Styled Text</ThemedText>
      );
      
      expect(getByText('Styled Text')).toBeTruthy();
    });
  });

  describe('Text Types', () => {
    it('renders default type correctly', () => {
      const { getByText } = render(
        <ThemedText type="default">Default Text</ThemedText>
      );
      expect(getByText('Default Text')).toBeTruthy();
    });

    it('renders title type correctly', () => {
      const { getByText } = render(
        <ThemedText type="title">Title Text</ThemedText>
      );
      expect(getByText('Title Text')).toBeTruthy();
    });

    it('renders subtitle type correctly', () => {
      const { getByText } = render(
        <ThemedText type="subtitle">Subtitle Text</ThemedText>
      );
      expect(getByText('Subtitle Text')).toBeTruthy();
    });

    it('renders defaultSemiBold type correctly', () => {
      const { getByText } = render(
        <ThemedText type="defaultSemiBold">SemiBold Text</ThemedText>
      );
      expect(getByText('SemiBold Text')).toBeTruthy();
    });

    it('renders link type correctly', () => {
      const { getByText } = render(
        <ThemedText type="link">Link Text</ThemedText>
      );
      expect(getByText('Link Text')).toBeTruthy();
    });
  });

  describe('Text Props Passthrough', () => {
    it('passes through React Native Text props', () => {
      const { getByText } = render(
        <ThemedText numberOfLines={2} ellipsizeMode="tail">
          Long text that should be truncated
        </ThemedText>
      );
      
      expect(getByText('Long text that should be truncated')).toBeTruthy();
    });

    it('handles accessibility props', () => {
      const { getByText } = render(
        <ThemedText 
          accessibilityLabel="Test label"
          accessibilityRole="text"
        >
          Accessible Text
        </ThemedText>
      );
      
      expect(getByText('Accessible Text')).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty text', () => {
      const { root } = render(<ThemedText testID="empty-text"></ThemedText>);
      expect(root).toBeTruthy();
    });

    it('handles undefined children', () => {
      const { root } = render(<ThemedText testID="undefined-children">{undefined}</ThemedText>);
      expect(root).toBeTruthy();
    });

    it('handles null children', () => {
      const { root } = render(<ThemedText testID="null-children">{null}</ThemedText>);
      expect(root).toBeTruthy();
    });
  });
});

describe('ThemedView Component', () => {
  describe('Basic Rendering', () => {
    it('renders with default props', () => {
      const { getByTestId } = render(
        <ThemedView testID="themed-view">
          <ThemedText>Child Content</ThemedText>
        </ThemedView>
      );
      
      expect(getByTestId('themed-view')).toBeTruthy();
    });

    it('applies custom light and dark colors', () => {
      const { getByTestId } = render(
        <ThemedView 
          testID="colored-view"
          lightColor="#FF0000" 
          darkColor="#00FF00"
        >
          <ThemedText>Content</ThemedText>
        </ThemedView>
      );
      
      expect(getByTestId('colored-view')).toBeTruthy();
    });

    it('renders with custom style', () => {
      const customStyle = { padding: 20, margin: 10 };
      const { getByTestId } = render(
        <ThemedView testID="styled-view" style={customStyle}>
          <ThemedText>Styled Content</ThemedText>
        </ThemedView>
      );
      
      expect(getByTestId('styled-view')).toBeTruthy();
    });
  });

  describe('View Props Passthrough', () => {
    it('passes through React Native View props', () => {
      const { getByTestId } = render(
        <ThemedView 
          testID="view-with-props"
          pointerEvents="none"
        >
          <ThemedText>Content</ThemedText>
        </ThemedView>
      );
      
      expect(getByTestId('view-with-props')).toBeTruthy();
    });

    it('handles accessibility props', () => {
      const { getByTestId } = render(
        <ThemedView 
          testID="accessible-view"
          accessibilityLabel="Main container"
          accessibilityRole="main"
        >
          <ThemedText>Accessible Content</ThemedText>
        </ThemedView>
      );
      
      expect(getByTestId('accessible-view')).toBeTruthy();
    });
  });

  describe('Children Rendering', () => {
    it('renders single child correctly', () => {
      const { getByText, getByTestId } = render(
        <ThemedView testID="single-child-view">
          <ThemedText>Single Child</ThemedText>
        </ThemedView>
      );
      
      expect(getByTestId('single-child-view')).toBeTruthy();
      expect(getByText('Single Child')).toBeTruthy();
    });

    it('renders multiple children correctly', () => {
      const { getByText, getByTestId } = render(
        <ThemedView testID="multi-child-view">
          <ThemedText>First Child</ThemedText>
          <ThemedText>Second Child</ThemedText>
        </ThemedView>
      );
      
      expect(getByTestId('multi-child-view')).toBeTruthy();
      expect(getByText('First Child')).toBeTruthy();
      expect(getByText('Second Child')).toBeTruthy();
    });

    it('handles empty children', () => {
      const { getByTestId } = render(
        <ThemedView testID="empty-view" />
      );
      
      expect(getByTestId('empty-view')).toBeTruthy();
    });
  });

  describe('Layout Behavior', () => {
    it('applies flex layout correctly', () => {
      const { getByTestId } = render(
        <ThemedView 
          testID="flex-view"
          style={{ flex: 1, flexDirection: 'row' }}
        >
          <ThemedText>Flex Content</ThemedText>
        </ThemedView>
      );
      
      expect(getByTestId('flex-view')).toBeTruthy();
    });

    it('handles positioning styles', () => {
      const { getByTestId } = render(
        <ThemedView 
          testID="positioned-view"
          style={{ position: 'absolute', top: 10, left: 10 }}
        >
          <ThemedText>Positioned Content</ThemedText>
        </ThemedView>
      );
      
      expect(getByTestId('positioned-view')).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('handles undefined style gracefully', () => {
      expect(() => {
        render(
          <ThemedView testID="undefined-style" style={undefined}>
            <ThemedText>Content</ThemedText>
          </ThemedView>
        );
      }).not.toThrow();
    });

    it('handles null style gracefully', () => {
      expect(() => {
        render(
          <ThemedView testID="null-style" style={null}>
            <ThemedText>Content</ThemedText>
          </ThemedView>
        );
      }).not.toThrow();
    });
  });
});

describe('ThemedComponents Integration', () => {
  it('works together in complex layouts', () => {
    const { getByText, getByTestId } = render(
      <ThemedView testID="container">
        <ThemedText type="title">Main Title</ThemedText>
        <ThemedView testID="content-container">
          <ThemedText type="subtitle">Subtitle</ThemedText>
          <ThemedText>Regular content</ThemedText>
          <ThemedText type="link">Link content</ThemedText>
        </ThemedView>
      </ThemedView>
    );
    
    expect(getByTestId('container')).toBeTruthy();
    expect(getByTestId('content-container')).toBeTruthy();
    expect(getByText('Main Title')).toBeTruthy();
    expect(getByText('Subtitle')).toBeTruthy();
    expect(getByText('Regular content')).toBeTruthy();
    expect(getByText('Link content')).toBeTruthy();
  });

  it('maintains theme consistency across nested components', () => {
    const { getByText, getByTestId } = render(
      <ThemedView testID="themed-container" lightColor="#F0F0F0">
        <ThemedText lightColor="#333333">Themed Text</ThemedText>
        <ThemedView testID="nested-view" lightColor="#E0E0E0">
          <ThemedText lightColor="#666666">Nested Text</ThemedText>
        </ThemedView>
      </ThemedView>
    );
    
    expect(getByTestId('themed-container')).toBeTruthy();
    expect(getByTestId('nested-view')).toBeTruthy();
    expect(getByText('Themed Text')).toBeTruthy();
    expect(getByText('Nested Text')).toBeTruthy();
  });
});