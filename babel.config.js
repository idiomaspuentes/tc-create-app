module.exports = {
	presets: [
		'@babel/env',
		'@babel/react',
	],
	plugins: ['@babel/transform-runtime', '@babel/plugin-proposal-nullish-coalescing-operator', '@babel/plugin-proposal-optional-chaining']
};
