module.exports = ({ config }) => {
  const releaseVersion = process.env.LINGOQUEST_RELEASE_VERSION;
  const preview = releaseVersion?.endsWith('-preview');

  if (
    releaseVersion &&
    !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(-preview)?$/.test(releaseVersion)
  ) {
    throw new Error(
      'LINGOQUEST_RELEASE_VERSION must be major.minor.patch with an optional -preview suffix.',
    );
  }

  if (process.env.EAS_BUILD_PROFILE === 'production' && (!releaseVersion || preview)) {
    throw new Error('Production builds require a stable LINGOQUEST_RELEASE_VERSION.');
  }

  return {
    ...config,
    version: releaseVersion || '0.0.0',
    ...(preview && {
      ios: { ...config.ios, version: releaseVersion.slice(0, -'-preview'.length) },
    }),
  };
};
