module.exports = ({ config }) => {
  const releaseVersion = process.env.LINGOQUEST_RELEASE_VERSION;

  if (process.env.EAS_BUILD_PROFILE === 'production' && !releaseVersion) {
    throw new Error('Production builds require LINGOQUEST_RELEASE_VERSION.');
  }

  if (releaseVersion && !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(releaseVersion)) {
    throw new Error('LINGOQUEST_RELEASE_VERSION must be an explicit major.minor.patch version.');
  }

  return { ...config, version: releaseVersion || '0.0.0' };
};
