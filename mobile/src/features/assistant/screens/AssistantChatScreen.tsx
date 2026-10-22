import { Ionicons } from '@expo/vector-icons';
import { useHeaderHeight } from '@react-navigation/elements';
import { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import type { AssistantScreenProps } from '../../../app/navigation/types';
import type { AssistantMessage, AssistantSource } from '../../../shared/api/types';
import { useIsOnline } from '../../../shared/offline/network';
import { colors } from '../../../shared/theme/colors';
import { CONTENT_MAX_WIDTH, font, MIN_TOUCH, radius, spacing } from '../../../shared/theme/tokens';
import { useAskAssistant, useAssistantFeedback, useConversationMessages } from '../api';

interface ChatMessage extends AssistantMessage {
  /** Nur lokal: Frage wurde noch nicht beantwortet */
  pending?: boolean;
  /** Nur lokal: Senden ist fehlgeschlagen */
  failed?: boolean;
}

const SUGGESTION_KEYS = [
  'assistant.suggestion1',
  'assistant.suggestion2',
  'assistant.suggestion3',
  'assistant.suggestion4',
] as const;

export function AssistantChatScreen({ navigation, route }: AssistantScreenProps<'AssistantChat'>) {
  const { t } = useTranslation();
  const online = useIsOnline();
  const headerHeight = useHeaderHeight();
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const initialConversationId = route.params?.conversationId;
  const [conversationId, setConversationId] = useState<string | undefined>(initialConversationId);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');

  const history = useConversationMessages(initialConversationId);
  const ask = useAskAssistant();
  const feedback = useAssistantFeedback();

  // Gespeicherten Verlauf übernehmen, wenn ein Gespräch aus der Liste geöffnet wurde
  useEffect(() => {
    if (history.data) setMessages(history.data);
  }, [history.data]);

  // Anderes Gespräch oder neues Gespräch über die Route
  useEffect(() => {
    setConversationId(initialConversationId);
    if (!initialConversationId) setMessages([]);
  }, [initialConversationId]);

  const send = async (text: string, retryOf?: string) => {
    const question = text.trim();
    if (!question || ask.isPending || !online) return;

    const localId = retryOf ?? `local-${Date.now()}`;
    const userMessage: ChatMessage = {
      id: localId,
      role: 'user',
      content: question,
      sources: [],
      feedback: null,
      createdAt: new Date().toISOString(),
      pending: true,
    };

    setMessages((current) =>
      retryOf
        ? current.map((m) => (m.id === retryOf ? { ...userMessage } : m))
        : [...current, userMessage],
    );
    setInput('');

    try {
      const reply = await ask.mutateAsync({ conversationId, message: question });
      setConversationId(reply.conversationId);
      setMessages((current) => [
        ...current.map((m) => (m.id === localId ? { ...m, pending: false } : m)),
        reply.message,
      ]);
    } catch {
      setMessages((current) =>
        current.map((m) => (m.id === localId ? { ...m, pending: false, failed: true } : m)),
      );
    }
  };

  const rate = (message: ChatMessage, value: 1 | -1) => {
    setMessages((current) => current.map((m) => (m.id === message.id ? { ...m, feedback: value } : m)));
    feedback.mutate({ messageId: message.id, value });
  };

  const openSource = (source: AssistantSource) => {
    if (source.documentId) {
      navigation.navigate('DocumentsTab', {
        screen: 'DocumentViewer',
        params: { documentId: source.documentId },
      });
    } else if (source.url) {
      void Linking.openURL(source.url).catch(() => undefined);
    }
  };

  const startNew = () => {
    setConversationId(undefined);
    setMessages([]);
    navigation.setParams({ conversationId: undefined });
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={headerHeight}
    >
      <View style={styles.toolbar}>
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate('AssistantHistory')}
          style={styles.toolbarButton}
        >
          <Ionicons name="time-outline" size={22} color={colors.brandPrimary} />
          <Text style={styles.toolbarText}>{t('assistant.history')}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={startNew} style={styles.toolbarButton}>
          <Ionicons name="create-outline" size={22} color={colors.brandPrimary} />
          <Text style={styles.toolbarText}>{t('assistant.newChat')}</Text>
        </Pressable>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(message) => message.id}
        contentContainerStyle={styles.list}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={styles.welcome}>
            <Ionicons name="chatbubble-ellipses-outline" size={44} color={colors.brandPrimary} />
            <Text style={styles.welcomeTitle}>{t('assistant.welcomeTitle')}</Text>
            <Text style={styles.welcomeText}>{t('assistant.welcomeText')}</Text>
            {SUGGESTION_KEYS.map((key) => (
              <Pressable
                key={key}
                accessibilityRole="button"
                disabled={!online}
                onPress={() => void send(t(key))}
                style={[styles.suggestion, !online && styles.disabled]}
              >
                <Text style={styles.suggestionText}>{t(key)}</Text>
              </Pressable>
            ))}
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.bubbleRow, item.role === 'user' && styles.bubbleRowUser]}>
            <View style={[styles.bubble, item.role === 'user' ? styles.bubbleUser : styles.bubbleAssistant]}>
              <Text style={[styles.bubbleText, item.role === 'user' && styles.bubbleTextUser]} selectable>
                {item.content}
              </Text>

              {item.sources.length > 0 ? (
                <View style={styles.sources}>
                  <Text style={styles.sourcesTitle}>{t('assistant.sources')}</Text>
                  {item.sources.map((source, index) => (
                    <Pressable
                      key={`${source.title}-${index}`}
                      accessibilityRole="link"
                      onPress={() => openSource(source)}
                      style={styles.source}
                    >
                      <Ionicons name="document-text-outline" size={18} color={colors.brandPrimary} />
                      <Text style={styles.sourceText} numberOfLines={2}>
                        {source.title}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}

              {item.role === 'assistant' && !item.id.startsWith('local-') ? (
                <View style={styles.feedbackRow}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t('assistant.helpful')}
                    accessibilityState={{ selected: item.feedback === 1 }}
                    onPress={() => rate(item, 1)}
                    style={styles.feedbackButton}
                  >
                    <Ionicons
                      name={item.feedback === 1 ? 'thumbs-up' : 'thumbs-up-outline'}
                      size={22}
                      color={colors.brandPrimary}
                    />
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t('assistant.notHelpful')}
                    accessibilityState={{ selected: item.feedback === -1 }}
                    onPress={() => rate(item, -1)}
                    style={styles.feedbackButton}
                  >
                    <Ionicons
                      name={item.feedback === -1 ? 'thumbs-down' : 'thumbs-down-outline'}
                      size={22}
                      color={colors.brandPrimary}
                    />
                  </Pressable>
                </View>
              ) : null}

              {item.failed ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => void send(item.content, item.id)}
                  style={styles.retry}
                >
                  <Text style={styles.retryText}>{t('assistant.sendFailed')}</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        )}
        ListFooterComponent={
          ask.isPending ? (
            <Text style={styles.thinking} accessibilityLiveRegion="polite">
              {t('assistant.thinking')}
            </Text>
          ) : null
        }
      />

      <View style={styles.composer}>
        {!online ? <Text style={styles.offline}>{t('assistant.offline')}</Text> : null}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder={t('assistant.placeholder')}
            placeholderTextColor={colors.textSecondary}
            accessibilityLabel={t('assistant.placeholder')}
            multiline
            maxLength={1000}
            editable={online}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('assistant.send')}
            disabled={!online || ask.isPending || input.trim().length === 0}
            onPress={() => void send(input)}
            style={[
              styles.sendButton,
              (!online || ask.isPending || input.trim().length === 0) && styles.disabled,
            ]}
          >
            <Ionicons name="send" size={22} color={colors.brandOnPrimary} />
          </Pressable>
        </View>
        <Text style={styles.disclaimer}>{t('assistant.disclaimer')}</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
  },
  toolbarButton: { minHeight: MIN_TOUCH, flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  toolbarText: { fontSize: font.body, color: colors.brandPrimary, fontWeight: '600' },
  list: {
    flexGrow: 1,
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  welcome: { alignItems: 'stretch', gap: spacing.sm, paddingTop: spacing.lg },
  welcomeTitle: { fontSize: font.headline, fontWeight: '700', color: colors.textPrimary, textAlign: 'center' },
  welcomeText: { fontSize: font.body, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.sm },
  suggestion: {
    minHeight: MIN_TOUCH + 8,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
  },
  suggestionText: { fontSize: font.bodyLarge, color: colors.brandPrimary },
  bubbleRow: { flexDirection: 'row' },
  bubbleRowUser: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '88%', padding: spacing.md, borderRadius: radius.lg, gap: spacing.sm },
  bubbleUser: { backgroundColor: colors.brandPrimary },
  bubbleAssistant: { backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  bubbleText: { fontSize: font.bodyLarge, color: colors.textPrimary, lineHeight: 24 },
  bubbleTextUser: { color: colors.brandOnPrimary },
  sources: { gap: spacing.xs, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, paddingTop: spacing.sm },
  sourcesTitle: { fontSize: font.caption, color: colors.textSecondary, fontWeight: '600' },
  source: { minHeight: MIN_TOUCH - 8, flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  sourceText: { flex: 1, fontSize: font.body, color: colors.brandPrimary },
  feedbackRow: { flexDirection: 'row', gap: spacing.xs },
  feedbackButton: { minWidth: MIN_TOUCH, minHeight: MIN_TOUCH - 8, alignItems: 'center', justifyContent: 'center' },
  retry: { minHeight: MIN_TOUCH - 8, justifyContent: 'center' },
  retryText: { fontSize: font.body, color: colors.danger, fontWeight: '600' },
  thinking: { fontSize: font.body, color: colors.textSecondary, paddingVertical: spacing.sm },
  composer: {
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
    padding: spacing.md,
    gap: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  offline: { fontSize: font.caption, color: colors.danger },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
  input: {
    flex: 1,
    minHeight: MIN_TOUCH + 4,
    maxHeight: 140,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: font.bodyLarge,
    color: colors.textPrimary,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
  },
  sendButton: {
    width: MIN_TOUCH + 4,
    height: MIN_TOUCH + 4,
    borderRadius: radius.md,
    backgroundColor: colors.brandPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.4 },
  disclaimer: { fontSize: font.caption, color: colors.textSecondary },
});
