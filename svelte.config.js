import adapter from '@sveltejs/adapter-node';

export default {
  kit: {
    adapter: adapter({
      out: 'build' // REQUIRED to create a runnable build directory
    })
  }
};
