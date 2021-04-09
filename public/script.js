export async function playSound(state) {
	if (!notifyBySound) return;
	let file_audio = '';
	switch (state) {
		case 'addPeer':
			file_audio = 'audio/add_peer.mp3';
			break;
		case 'removePeer':
			file_audio = 'audio/remove_peer.mp3';
			break;
		case 'newMessage':
			file_audio = 'audio/new_message.mp3';
			break;
		case 'error':
			file_audio = 'audio/error.mp3';
			break;
		default:
			console.log('no file audio');
	}
	if (file_audio != '') {
		let audioToPlay = new Audio(file_audio);
		try {
			await audioToPlay.play();
		} catch (e) {
			return;
		}
	}
}

export function getId(id) {
	return document.getElementById(id);
}
export function getSl(selector) {
	return document.querySelector(selector);
}

export function userLog(type, message) {
	switch (type) {
		case 'error':
			Swal.fire({
				position: 'center',
				icon: 'error',
				title: 'Oops...',
				text: message,
				showClass: {
					popup: 'animate__animated animate__fadeInDown',
				},
				hideClass: {
					popup: 'animate__animated animate__fadeOutUp',
				},
			});
			playSound('error');
			break;
		case 'info':
			Swal.fire({
				position: 'center',
				icon: 'info',
				title: 'Info',
				text: message,
				showClass: {
					popup: 'animate__animated animate__fadeInDown',
				},
				hideClass: {
					popup: 'animate__animated animate__fadeOutUp',
				},
			});
			break;
		// ......
		default:
			alert(message);
	}
}
export function leaveRoom() {
	Swal.fire({
		position: 'center',
		title: 'Leave this room?',
		showDenyButton: true,
		confirmButtonText: `Yes`,
		denyButtonText: `No`,
		showClass: {
			popup: 'animate__animated animate__fadeInDown',
		},
		hideClass: {
			popup: 'animate__animated animate__fadeOutUp',
		},
	}).then((result) => {
		if (result.isConfirmed) {
			window.location.href = '/';
		}
	});
}
