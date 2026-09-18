
### WMX JSON schema
Name | Description | Required | Default |
---- |-------------|----------| --------------|
**name** | name of the component in lowercase alphabets. | Yes||
**displayName**| Regular Name to display in Studio. If not specified, name is used displayName.  | No | |
**description**| Additional information about the component. This will be used in Studio as help info to developers. | No | |
**iconUrl** | relative path of icon svg image. Ex: icon.svg | No |  |
**webSupport** | Indicates whether this component can render in web preview | No | false |
**props** | A map of properties. property name is key and property as value. For more information about property see below | No | |
**events** | A map of events. event name is key and event as value. For more information about event see below | No | |
**styles** | A map of styles. style name is key and style as value. For more information about style see below  | No | |

### Property Schema

Name | Description | Required | Default |
---- |-------------|----------| --------------|
**name** | name of the property in aplhanumeric. | Yes||
**displayName**| Regular Name to display in Studio. If not specified, name is used displayName.  | No | |
**description**| Additional information about the property. This will be used in Studio as help info to developers. | No | |
**type** | Indicates the type of property. Allowed values are number, string, boolean, object.| No | string |
**isList** | A boolean value that indicates whether this is of array type| No | false |
**defaultValue** | Value for this property by default | No | |
**isRequired** | A boolean value that indicates whether value to this property is required | No | false


### Event Schema

Name | Description | Required | Default |
---- |-------------|----------| --------------|
**name** | name of the event in aplhanumeric. | Yes||
**displayName**| Regular Name to display in Studio. If not specified, name is used displayName.  | No | |
**description**| Additional information about the event. This will be used in Studio as help info to developers. | No | |


### Style Schema

Name | Description | Required | Default |
---- |-------------|----------| --------------|
**name** | name of the style property in aplhanumeric. | Yes||
**style**| default styles | No| |
