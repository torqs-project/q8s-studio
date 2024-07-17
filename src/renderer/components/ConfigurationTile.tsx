import runIcon from '../../../assets/icons/run.svg';

interface ConfigurationTileProps {
  configName: string;
  kubePath: string;
  workspacePath: string;
}
/**
 * A tile that shows the saved environment configuration.
 */
export default function ConfigurationTile({
  configName = 'default name',
  kubePath = '',
  workspacePath = '',
}: ConfigurationTileProps): React.JSX.Element {
  return (
    <div className="tile">
      <span> {configName}</span> <img src={runIcon} alt="" />
    </div>
  );
}
