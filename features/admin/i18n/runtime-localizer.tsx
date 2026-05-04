'use client';

import { useEffect } from 'react';
import { isAdminInlineTechnicalText, useAdminI18n } from '@/features/admin/i18n';

function shouldSkipElement(element: Element | null): boolean {
  if (!element) return true;
  const tag = element.tagName.toLowerCase();
  return tag === 'script' || tag === 'style' || tag === 'noscript' || tag === 'code' || tag === 'pre';
}

function looksLikeStructuredValue(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  if (/^[-+]?\d+([.,]\d+)?$/.test(trimmed)) return true;
  if (isAdminInlineTechnicalText(trimmed)) return true;
  if (/^[0-9a-f]{8,}$/i.test(trimmed)) return true;
  return false;
}

function translateTextNodes(root: ParentNode, translate: (value: string) => string) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const updates: Array<{ node: Text; value: string }> = [];

  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    const parent = node.parentElement;
    if (shouldSkipElement(parent)) continue;

    const raw = node.nodeValue ?? '';
    if (!raw.trim()) continue;
    if (looksLikeStructuredValue(raw)) continue;

    const translated = translate(raw);
    if (translated && translated !== raw) {
      updates.push({ node, value: translated });
    }
  }

  for (const { node, value } of updates) {
    node.nodeValue = value;
  }
}

export function AdminRuntimeLocalizer() {
  const { tInline } = useAdminI18n();

  useEffect(() => {
    const adminRoot = document.querySelector('[data-admin-root]');
    if (!adminRoot) return;
    const root = adminRoot as Element;

    const translateRoot = (target: ParentNode) => {
      translateTextNodes(target, tInline);
    };

    translateRoot(root);

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'characterData') {
          const textNode = mutation.target as Text;
          const value = textNode.nodeValue ?? '';
          if (!value.trim() || looksLikeStructuredValue(value)) continue;
          const translated = tInline(value);
          if (translated && translated !== value) {
            textNode.nodeValue = translated;
          }
          continue;
        }

        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.TEXT_NODE) {
              const textNode = node as Text;
              const value = textNode.nodeValue ?? '';
              if (!value.trim() || looksLikeStructuredValue(value)) return;
              const translated = tInline(value);
              if (translated && translated !== value) {
                textNode.nodeValue = translated;
              }
              return;
            }

            if (node.nodeType === Node.ELEMENT_NODE) {
              translateRoot(node as Element);
            }
          });
        }
      }
    });

    observer.observe(root, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => observer.disconnect();
  }, [tInline]);

  return null;
}
