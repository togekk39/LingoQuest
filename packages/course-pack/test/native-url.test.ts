import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateGitHubCourseDownloadUrl } from '../src/index';

test('GitHub file downloads keep the exact path under React Native URL serialization', () => {
  const NativeURL = globalThis.URL;
  class ReactNativeLikeURL extends NativeURL {
    override toString() {
      const value = super.toString();
      return value.endsWith('/') || value.includes('?') ? value : value + '/';
    }
  }
  globalThis.URL = ReactNativeLikeURL;
  try {
    for (const file of [
      'https://raw.githubusercontent.com/owner/course/abc123/course.lqp.json',
      'https://github.com/owner/course/releases/download/course-v1.0.0/course.lqp.json',
    ]) {
      assert.equal(new URL(file).toString(), file + '/');
      assert.equal(validateGitHubCourseDownloadUrl(` ${file} `), file);
    }
    assert.throws(() => validateGitHubCourseDownloadUrl('https://example.com/course.lqp.json'));
    assert.throws(() => validateGitHubCourseDownloadUrl('https://github.com/owner/course'));
    assert.throws(() =>
      validateGitHubCourseDownloadUrl(
        'https://user:password@github.com/owner/course/releases/download/v1/course.lqp.json',
      ),
    );
  } finally {
    globalThis.URL = NativeURL;
  }
});
