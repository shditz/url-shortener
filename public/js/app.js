document.addEventListener('DOMContentLoaded', () => {
  // Elements: Shorten Form
  const shortenForm = document.getElementById('shorten-form');
  const originalUrlInput = document.getElementById('original-url');
  const customAliasInput = document.getElementById('custom-alias');
  const expiresAtInput = document.getElementById('expires-at');
  const advancedOptions = document.getElementById('advanced-options');
  const btnSubmit = document.getElementById('btn-submit');
  const shortenError = document.getElementById('shorten-error');

  // Elements: Result Card
  const resultCard = document.getElementById('result-card');
  const resultShortUrl = document.getElementById('result-short-url');
  const resultOrigUrl = document.getElementById('result-orig-url');
  const resultClicks = document.getElementById('result-clicks');
  const resultExpires = document.getElementById('result-expires');
  const btnCopyResult = document.getElementById('btn-copy-result');
  const btnShortenAnother = document.getElementById('btn-shorten-another');

  // Elements: Stats / Inspector
  const lookupForm = document.getElementById('lookup-form');
  const lookupCodeInput = document.getElementById('lookup-code');
  const btnLookup = document.getElementById('btn-lookup');
  const lookupError = document.getElementById('lookup-error');
  const statsView = document.getElementById('stats-view');
  const statsClicks = document.getElementById('stats-clicks');
  const statsStatus = document.getElementById('stats-status');
  const statsShortUrl = document.getElementById('stats-short-url');
  const statsOrigUrl = document.getElementById('stats-orig-url');
  const statsCreated = document.getElementById('stats-created');
  const statsExpires = document.getElementById('stats-expires');
  const btnCopyStats = document.getElementById('btn-copy-stats');

  // Elements: Delete Action
  const deleteInitialView = document.getElementById('delete-initial-view');
  const deleteConfirmView = document.getElementById('delete-confirm-view');
  const btnStartDelete = document.getElementById('btn-start-delete');
  const btnCancelDelete = document.getElementById('btn-cancel-delete');
  const btnConfirmDelete = document.getElementById('btn-confirm-delete');

  let activeStatsCode = null;
  let copyTimeouts = new WeakMap();

  function formatDate(isoString) {
    if (!isoString) return 'Never (Permanent)';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  }

  function isLinkExpired(isoString) {
    if (!isoString) return false;
    const time = new Date(isoString).getTime();
    return !isNaN(time) && time <= Date.now();
  }

  function getReadableErrorMessage(data, defaultFallback) {
    if (data?.error?.message) {
      return data.error.message;
    }
    return defaultFallback;
  }

  function showError(el, message) {
    el.textContent = message;
    el.classList.remove('hidden');
  }

  function hideError(el) {
    el.textContent = '';
    el.classList.add('hidden');
  }

  function setButtonLoading(btn, isLoading, defaultText) {
    const spinner = btn.querySelector('.btn-spinner');
    const textSpan = btn.querySelector('.btn-text');
    btn.disabled = isLoading;

    if (isLoading) {
      if (spinner) spinner.classList.remove('hidden');
      if (textSpan) textSpan.textContent = 'Please wait...';
    } else {
      if (spinner) spinner.classList.add('hidden');
      if (textSpan) textSpan.textContent = defaultText;
    }
  }

  function copyText(text, btnElement, copyTextSelector = '.copy-btn-text') {
    if (!text) return;

    const performVisualUpdate = () => {
      const copyLabel = btnElement.querySelector(copyTextSelector);
      const copyIcon = btnElement.querySelector('.copy-icon');
      const checkIcon = btnElement.querySelector('.check-icon');

      btnElement.classList.add('copied');
      if (copyLabel) copyLabel.textContent = 'Copied!';
      if (copyIcon) copyIcon.classList.add('hidden');
      if (checkIcon) checkIcon.classList.remove('hidden');

      if (copyTimeouts.has(btnElement)) {
        clearTimeout(copyTimeouts.get(btnElement));
      }

      const timeout = setTimeout(() => {
        btnElement.classList.remove('copied');
        if (copyLabel) copyLabel.textContent = 'Copy';
        if (copyIcon) copyIcon.classList.remove('hidden');
        if (checkIcon) checkIcon.classList.add('hidden');
      }, 2000);

      copyTimeouts.set(btnElement, timeout);
    };

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(performVisualUpdate).catch(() => {
        fallbackCopy(text);
        performVisualUpdate();
      });
    } else {
      fallbackCopy(text);
      performVisualUpdate();
    }
  }

  function fallbackCopy(text) {
    const el = document.createElement('textarea');
    el.value = text;
    el.setAttribute('readonly', '');
    el.style.position = 'absolute';
    el.style.left = '-9999px';
    document.body.appendChild(el);
    el.select();
    try {
      document.execCommand('copy');
    } catch {
      // Ignore clipboard fallback failure
    }
    document.body.removeChild(el);
  }

  // Handle URL Shortening
  shortenForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError(shortenError);

    const original_url = originalUrlInput.value.trim();
    const custom_alias = customAliasInput.value.trim() || undefined;
    const expires_at_raw = expiresAtInput.value;
    const expires_at = expires_at_raw ? new Date(expires_at_raw).toISOString() : undefined;

    if (!original_url) {
      showError(shortenError, 'Please enter a destination URL.');
      originalUrlInput.focus();
      return;
    }

    setButtonLoading(btnSubmit, true, 'Create short URL');

    try {
      const res = await fetch('/api/urls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ original_url, custom_alias, expires_at }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        showError(shortenError, getReadableErrorMessage(data, 'Unable to create short URL.'));
        return;
      }

      const result = data.data;

      // Populate result section
      resultShortUrl.value = result.short_url;
      resultOrigUrl.textContent = result.original_url;
      resultOrigUrl.href = result.original_url;
      resultClicks.textContent = result.clicks;
      resultExpires.textContent = formatDate(result.expires_at);

      resultCard.classList.remove('hidden');
      resultShortUrl.select();
    } catch {
      showError(shortenError, 'Network error. Please check your connection and try again.');
    } finally {
      setButtonLoading(btnSubmit, false, 'Create short URL');
    }
  });

  // Shorten Another Link (Reset)
  btnShortenAnother.addEventListener('click', () => {
    originalUrlInput.value = '';
    customAliasInput.value = '';
    expiresAtInput.value = '';
    advancedOptions.removeAttribute('open');
    resultCard.classList.add('hidden');
    hideError(shortenError);
    originalUrlInput.focus();
  });

  // Copy Result Link
  btnCopyResult.addEventListener('click', () => {
    copyText(resultShortUrl.value, btnCopyResult, '.copy-btn-text');
  });

  // Handle Stats / Inspector Lookup
  lookupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError(lookupError);
    resetDeleteView();

    let rawCode = lookupCodeInput.value.trim();
    if (!rawCode) return;

    if (rawCode.includes('/')) {
      const parts = rawCode.split('/');
      rawCode = parts[parts.length - 1];
    }

    setButtonLoading(btnLookup, true, 'View stats');

    try {
      const res = await fetch(`/api/urls/${encodeURIComponent(rawCode)}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        statsView.classList.add('hidden');
        showError(lookupError, getReadableErrorMessage(data, 'Short link not found.'));
        return;
      }

      const info = data.data;
      activeStatsCode = info.short_code;

      statsClicks.textContent = info.clicks;
      const expired = isLinkExpired(info.expires_at);
      statsStatus.textContent = expired ? 'Expired' : 'Active';
      statsStatus.className = `status-indicator ${expired ? 'expired' : ''}`;

      statsShortUrl.textContent = info.short_url;
      statsShortUrl.href = info.short_url;
      statsOrigUrl.textContent = info.original_url;
      statsOrigUrl.href = info.original_url;
      statsCreated.textContent = formatDate(info.created_at);
      statsExpires.textContent = formatDate(info.expires_at);

      statsView.classList.remove('hidden');
    } catch {
      showError(lookupError, 'Network error. Unable to load link statistics.');
      statsView.classList.add('hidden');
    } finally {
      setButtonLoading(btnLookup, false, 'View stats');
    }
  });

  // Copy Stats Short Link
  btnCopyStats.addEventListener('click', () => {
    copyText(statsShortUrl.href, btnCopyStats, null);
    btnCopyStats.textContent = 'Copied!';
    setTimeout(() => {
      btnCopyStats.textContent = 'Copy';
    }, 2000);
  });

  // Inline Delete Handlers
  function resetDeleteView() {
    deleteInitialView.classList.remove('hidden');
    deleteConfirmView.classList.add('hidden');
    btnConfirmDelete.disabled = false;
  }

  btnStartDelete.addEventListener('click', () => {
    deleteInitialView.classList.add('hidden');
    deleteConfirmView.classList.remove('hidden');
  });

  btnCancelDelete.addEventListener('click', () => {
    resetDeleteView();
  });

  btnConfirmDelete.addEventListener('click', async () => {
    if (!activeStatsCode) return;

    setButtonLoading(btnConfirmDelete, true, 'Confirm Delete');

    try {
      const res = await fetch(`/api/urls/${encodeURIComponent(activeStatsCode)}`, {
        method: 'DELETE',
      });

      if (res.status === 204) {
        statsView.classList.add('hidden');
        lookupCodeInput.value = '';
        activeStatsCode = null;
        showError(lookupError, 'Short link has been permanently deleted.');
        lookupError.className = 'alert alert-error';
        lookupError.style.background = 'var(--success-subtle)';
        lookupError.style.borderColor = 'rgba(16, 185, 129, 0.3)';
        lookupError.style.color = 'var(--success)';
      } else {
        const data = await res.json();
        showError(lookupError, getReadableErrorMessage(data, 'Failed to delete link.'));
      }
    } catch {
      showError(lookupError, 'Network error while deleting short link.');
    } finally {
      resetDeleteView();
    }
  });
});
