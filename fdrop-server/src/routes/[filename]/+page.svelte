<script lang="ts">
	import { page } from '$app/stores';
	let filename = $page.params.filename;
	let password = null;
	let errorMsg = '';
	let hasPassword = $page.url.searchParams.get('hasPass');
	const downloadFile = async () => {
		errorMsg = '';

		try {
			const response = await fetch(`/fdrop/${filename}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ filename, password })
			});

			if (!response.ok) {
				errorMsg = 'Invalid password or file not found';
				return;
			}

			const blob = await response.blob();
			const link = document.createElement('a');
			link.href = URL.createObjectURL(blob);
			link.download = filename;
			link.click();
		} catch (error) {
			errorMsg = 'An error occurred while downloading';
			console.error(error);
		}
	};
</script>
<div class="center">
{#if hasPassword}
<input type="password" class="password-input" bind:value={password} placeholder="Enter password" />
{/if}
<button class="download-button" on:click={downloadFile}>Download File</button>
<p class="error-message" style="color: red;">{errorMsg}</p>
</div>
<style>
	.center{
			margin: auto;
			height: 100%;
			width: 100%;
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
	}
</style>