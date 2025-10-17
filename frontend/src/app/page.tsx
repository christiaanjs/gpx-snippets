import styles from './page.module.css';

export default function Home() {
	return (
		<div className={styles.page}>
			<main className={styles.main}>
				<p>Welcome to GPX snippets</p>
			</main>
		</div>
	);
}
